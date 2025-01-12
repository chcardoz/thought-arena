import systemPrompt from "@/app/constants";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcription, nodes, links } = await request.json();

    if (!transcription || !nodes || !links) {
      return NextResponse.json(
        { error: "Missing transcription, nodes, or links in request body" },
        { status: 400 }
      );
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: JSON.stringify({
          instruction: "Transform the graph based on the transcription.",
          transcription,
          graphState: { nodes, links },
        }),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "No response from the model" },
        { status: 500 }
      );
    }

    const parsedResult = JSON.parse(result);

    return NextResponse.json({ nodes: parsedResult.nodes, links: parsedResult.links });
  } catch (error) {
    console.error("Error in transform API:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
