import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Summary({ user }: { user: { uid: string } }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const moodSnap = await getDocs(collection(db, "users", user.uid, "moodLogs"));
        const moodLogs = moodSnap.docs.map((d) => ({
          date: d.id,
          mood: d.data().mood ?? 3,
          emotion: d.data().emotion ?? "",
          activity: d.data().activity,
          description: d.data().description,
        })).sort((a, b) => a.date.localeCompare(b.date));

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const contactsSnap = await getDocs(collection(db, "users", user.uid, "contacts"));
        const contacts: any[] = [];
        for (const cd of contactsSnap.docs) {
          const c = cd.data();
          const intSnap = await getDocs(collection(db, "users", user.uid, "contacts", cd.id, "interactions"));
          const dates = intSnap.docs.map((x) => x.id).sort();
          const weekCount = dates.filter((id) => new Date(id) >= weekAgo).length;
          contacts.push({
            name: c.name ?? "",
            relation: c.relation ?? "",
            lastInteraction: c.lastInteraction ?? null,
            interactionCount: dates.length,
            interactionsThisWeek: weekCount,
            connectionLevel: c.connectionLevel,
            interactionDates: dates,
          });
        }

        const r = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moodLogs, contacts, today: todayKey, totalLogCount: moodLogs.length }),
        });
        const data = (await r.json().catch(() => ({}))) as { summary?: string; error?: string };
        if (!ok) return;
        if (!r.ok) throw new Error(data.error || "Failed");
        setSummary(data.summary ?? null);
      } catch (e) {
        if (ok) setErr(e instanceof Error ? e.message : "Error");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [user.uid, retry]);

  if (loading) return <div className="bg-white border border-gray-200 rounded p-4">...</div>;
  if (err) return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <p className="text-red-600 text-sm">{err}</p>
      <button type="button" onClick={() => { setErr(null); setRetry((k) => k + 1); }} className="text-sm underline mt-1">Retry</button>
    </div>
  );
  if (!summary) return <p className="text-gray-500 text-sm">No data yet.</p>;
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h2 className="text-sm font-semibold mb-2">Summary</h2>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</p>
    </div>
  );
}
