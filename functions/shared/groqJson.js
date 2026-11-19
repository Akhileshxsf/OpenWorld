import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

function extractJsonBlob(raw) {
  let text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return text;
}

export function parseJsonFromModel(text) {
  const candidate = extractJsonBlob(text);
  try {
    return JSON.parse(candidate);
  } catch (firstError) {
    // Model sometimes truncates long JSON — try array/object salvage for {"matches":[...]}
    const matches = candidate.match(/"matches"\s*:\s*\[/);
    if (matches) {
      const sliced = candidate.length > 12000 ? candidate.slice(0, 12000) : candidate;
      const attempt = sliced.replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(attempt);
      } catch {
        /* fall through */
      }
    }
    const err = new Error(firstError.message || "Invalid JSON from model");
    err.cause = firstError;
    throw err;
  }
}

export async function groqJsonPrompt(prompt, { temperature = 0.3, retries = 2 } = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  let lastError;
  const tail =
    "\n\nReturn ONE valid JSON object only. No markdown. Escape double quotes inside strings. Keep every string under 120 characters.";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { text } = await generateText({
      model: groqClient("openai/gpt-oss-120b"),
      prompt: attempt === 0 ? prompt + tail : `${prompt}\n\nYour previous reply was invalid JSON. Try again. ${tail}`,
      temperature: attempt === 0 ? temperature : 0,
    });
    try {
      return parseJsonFromModel(text);
    } catch (error) {
      lastError = error;
      console.warn("groqJsonPrompt parse failed", { attempt, message: error.message?.slice(0, 120) });
    }
  }

  throw new Error(
    lastError?.message?.includes("Unterminated")
      ? "We couldn't read the AI response (truncated JSON). Please try Search again."
      : "We couldn't read the AI response. Please try again."
  );
}