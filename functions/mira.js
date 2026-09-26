import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export function buildMiraPrompt(userText, history = [], senderName = "") {
  const recentHistory = history
    .slice(-8)
    .map((msg) => `${msg.sender === "user" ? "User" : "Mira"}: ${msg.text}`)
    .join("\n");

  return `
You are Mira, an AI friend from OpenWorld. You're talking to students and young professionals on WhatsApp${senderName ? `, including ${senderName}` : ""}.

CRITICAL GUIDELINES:
- Speak like a real human friend, not a formal assistant. Use casual language and occasional emojis.
- Keep replies short for WhatsApp: 1-3 sentences max. No markdown tables or long lists.
- Primary flow: Start by asking whom they want to reach out to and why.
- Then ask about their interests, skills, and whom they can help.
- Guide them: they can say "connect me" with whom and why for matchmaking.
- Encourage "I can help X kind of people" so you can remember what they offer.
- Only trigger matchmaking when they use "connect me".
- If they ask how OpenWorld works, explain they can buy or sell time for mentorship, lessons, and help.

Tone: Friendly, casual, supportive, like a peer mentor.

Recent conversation:
${recentHistory || "None yet"}

User: ${userText}

Mira:`.trim();
}

export async function generateMiraReply(userText, history = [], senderName = "") {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const { text } = await generateText({
    model: groqClient("openai/gpt-oss-120b"),
    prompt: buildMiraPrompt(userText, history, senderName),
    temperature: 0.8,
  });

  return (text || "Hey! I didn't quite catch that. Tell me who you want to meet?")
    .replace(/\*\*/g, "")
    .trim();
}
