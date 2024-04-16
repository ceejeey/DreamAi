import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const API_KEY = process.env.GEMINI_AI_KEY!;

const genAI = new GoogleGenerativeAI(API_KEY);

const geminiPro = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data) {
    return NextResponse.json({ message: "Unauthorize" }, { status: 403 });
  }

  const { prompt } = await req.json();
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // const res = await openai.completions.create({
    //   prompt,
    //   model: "text-davinci-003",
    //   max_tokens: 512,
    //   temperature: 0,
    // });
    return NextResponse.json({ choices: response.text() });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 400 }
    );
  }
}
