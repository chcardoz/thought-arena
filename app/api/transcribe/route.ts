import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio") as Blob;

  if (!audio) {
    return NextResponse.json(
      { error: "No audio file provided" },
      { status: 400 }
    );
  }

  const response = await openai.audio.transcriptions.create({
    file: new File([audio], "audio.wav", { type: audio.type }),
    model: "whisper-1",
  });

  return NextResponse.json({ text: response.text });
}
