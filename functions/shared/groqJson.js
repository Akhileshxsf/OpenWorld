import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export function parseJsonFromModel(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  return JSON.parse(candidate);
}

export async function groqJsonPrompt(prompt, { temperature = 0.3 } = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const { text } = await generateText({
    model: groqClient("openai/gpt-oss-120b"),
    prompt,
    temperature,
  });

  return parseJsonFromModel(text);
}
