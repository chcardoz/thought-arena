import { z } from "zod";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { systemPrompt2 } from "@/app/constants";
import { GraphStateSchema } from "./zod-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcription, nodes, links } = await request.json();

    const graphState = { nodes, links };
    try {
      GraphStateSchema.parse(graphState);
    } catch (err) {
      const errorMessage =
        err instanceof z.ZodError
          ? err.errors
          : "Unknown error during request validation";
      return NextResponse.json(
        {
          error: "Invalid graph structure in request body",
          details: errorMessage,
        },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system" as const, content: systemPrompt2 },
      {
        role: "user" as const,
        content: JSON.stringify({
          instruction: "Transform the graph based on the transcription.",
          transcription,
          graphState,
        }),
      },
    ];

    // Use zodResponseFormat for structured output validation
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      response_format: zodResponseFormat(GraphStateSchema, "graphState"),
    });

    const parsedResult = completion.choices[0]?.message?.parsed;

    if (!parsedResult) {
      return NextResponse.json(
        { error: "No response from the model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      nodes: parsedResult.nodes,
      links: parsedResult.links,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("Error in transform API:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
