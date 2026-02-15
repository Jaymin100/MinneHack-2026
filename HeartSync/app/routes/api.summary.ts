import OpenAI from "openai";
import type { ActionFunctionArgs } from "react-router";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const { moodLogs = [], contacts = [], today: todayStr, totalLogCount } = body;

  const moodSummary = moodLogs.length
    ? moodLogs
        .slice(-20)
        .map((l) => {
          let line = `- ${l.date}: mood ${l.mood}/5, emotion: ${l.emotion || "none"}`;
          if (l.activity) line += `, activity: ${l.activity}`;
          if (l.description) line += ` — "${l.description}"`;
          return line;
        })
        .join("\n")
    : "No mood logs yet.";

  const totalConnections = contacts.length;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const connectionsThisWeek = contacts.filter((c) => {
    if (c.interactionsThisWeek > 0) return true;
    if (c.lastInteraction && Date.now() - new Date(c.lastInteraction).getTime() < oneWeekMs) return true;
    return false;
  }).length;
  const needsReachOut = contacts.filter((c) => {
    if (!c.lastInteraction) return true;
    const daysSince = (Date.now() - new Date(c.lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 21;
  });

  const getWeekStart = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  };
  const weekAvgs: { weekStart: string; avg: number; count: number }[] = [];
  const byWeek = new Map<string, { sum: number; count: number }>();
  for (const log of moodLogs) {
    const wk = getWeekStart(log.date);
    const cur = byWeek.get(wk) ?? { sum: 0, count: 0 };
    cur.sum += log.mood;
    cur.count += 1;
    byWeek.set(wk, cur);
  }
  byWeek.forEach((v, weekStart) => {
    if (v.count >= 1) weekAvgs.push({ weekStart, avg: v.sum / v.count, count: v.count });
  });
  const bestWeek =
    weekAvgs.length > 0
      ? weekAvgs.reduce((a, b) => (a.avg >= b.avg ? a : b))
      : null;
  const bestWeekStr = bestWeek
    ? `Week of ${new Date(bestWeek.weekStart + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}: avg mood ${bestWeek.avg.toFixed(1)}/5 (${bestWeek.count} logs)`
    : "Not enough data (need at least 1 mood log)";

  const contactSummary =
    contacts.length > 0
      ? contacts
          .map((c) => {
            const dates = c.interactionDates ?? [];
            const datesStr =
              dates.length > 0
                ? `, interacted on: ${dates.slice(-5).map((d) => new Date(d).toLocaleDateString()).join(", ")}`
                : "";
            return `- ${c.name} (${c.relation}): connectionLevel ${c.connectionLevel ?? "?"}/10, last interacted ${c.lastInteraction || "never"}, total: ${c.interactionCount}, this week: ${c.interactionsThisWeek}${datesStr}`;
          })
          .join("\n")
      : "No contacts yet.";

  const logCount = totalLogCount ?? moodLogs.length;
  const reachOutNames = needsReachOut.map((c) => c.name).join(", ");

  const prompt = `You are a friendly wellness assistant for HeartSync. Today: ${todayStr || "?"}. Use only real data.

KEY CONTEXT:
- TOTAL LOG COUNT: ${logCount} (use for "You logged X times")
- TOTAL CONNECTIONS: ${totalConnections}
- CONNECTIONS THIS WEEK: ${connectionsThisWeek}
- BEST WEEK: ${bestWeekStr}
- Connection level 1-2=been awhile, 3-4=okay, 5-6=good, 7-10=great
${reachOutNames ? `- REACH OUT TO: ${reachOutNames}` : ""}
${totalConnections === 1 ? "- Note: 1 connection only—do not suggest reaching out to someone else" : ""}

MOOD LOGS (date, mood 1-5, emotion, activity, description):
${moodSummary}

CONTACTS & INTERACTIONS:
${contactSummary}

FORMAT (order 1-7; use exact numbers for 1-4; vary wording for 5-7):
1. Streak: "Your streak is X consecutive days."
2. Recent mood: mention latest mood/emotion, activity, description
3. "Your average mood for the last month is X." "Your most common emotion was X."
4. "You logged ${logCount} times."
5. Best week: use the data above or skip if none
6. "You connected with ${connectionsThisWeek} of your ${totalConnections} connection(s) this week." Who they said hi to most, connection levels
7. Reach-out nudge if applicable

Second person. Never invent data.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  });
  const summary = completion.choices[0]?.message?.content ?? "";
  return Response.json({ summary });
}
