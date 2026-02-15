import OpenAI from "openai";
import type { ActionFunctionArgs } from "react-router";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function action({ request }: ActionFunctionArgs) {
  const body = (await request.json()) as {
    moodLogs?: Array<{ date: string; mood: number; emotion: string; activity?: string; description?: string }>;
    contacts?: Array<{
      name: string;
      relation: string;
      lastInteraction: string | null;
      interactionCount: number;
      interactionsThisWeek: number;
      connectionLevel?: number;
      interactionDates?: string[];
    }>;
    today?: string;
    totalLogCount?: number;
  };
  const { moodLogs = [], contacts = [], today: todayStr, totalLogCount = 0 } = body;

  const moodText = moodLogs.length
    ? moodLogs.slice(-15).map((l) => `${l.date}: ${l.mood}/5 ${l.emotion || ""} ${l.activity || ""} ${l.description || ""}`).join("\n")
    : "No mood logs.";
  const contactText = contacts.length
    ? contacts.map((c) => `${c.name} (${c.relation}) level ${c.connectionLevel ?? "?"}/10, last ${c.lastInteraction || "never"}, this week ${c.interactionsThisWeek}`).join("\n")
    : "No contacts.";
  const needReachOut = contacts.filter((c) => !c.lastInteraction || (Date.now() - new Date(c.lastInteraction).getTime()) / (24 * 60 * 60 * 1000) >= 21).map((c) => c.name);

  const prompt = `HeartSync summary. Today: ${todayStr || "?"}. Log count: ${totalLogCount ?? moodLogs.length}. Connections: ${contacts.length}.
MOOD LOGS:
${moodText}
CONTACTS:
${contactText}
${needReachOut.length ? `Consider reaching out: ${needReachOut.join(", ")}.` : ""}
Write a short second-person summary (2–4 sentences). Use only the data above. No fluff.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  });
  const summary = res.choices[0]?.message?.content ?? "";
  return Response.json({ summary });
}
