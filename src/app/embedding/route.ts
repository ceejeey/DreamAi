import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const API_KEY = process.env.GEMINI_AI_KEY!;

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req: Request) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data) {
    return NextResponse.json({ message: "Unauthorize" }, { status: 403 });
  }

  const request = await req.json();

  if (!request?.text) {
    return NextResponse.json(
      {
        message: "Invalid request missing key.",
      },
      { status: 422 }
    );
  }

  // For embeddings, use the embedding-001 model

  // console.log("🚀 ~ POST ~ model:", model);

  try {
    // OPEN AI MODAL
    // const result = await openai.embeddings.create({
    //   input: request.text,
    //   model: "text-embedding-3-small",
    // });
    // const embedding = result.data[0].embedding;
    // const token = result.usage.total_tokens;

    // Get models for token counting and embedding
    const geminiPro = genAI.getGenerativeModel({ model: "gemini-pro" });
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    // Perform token counting and embedding
    const { totalTokens: token } = await geminiPro.countTokens(request.text);
    const { embedding } = await model.embedContent(request.text);

    // Return the results
    return NextResponse.json({ token, embedding });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
