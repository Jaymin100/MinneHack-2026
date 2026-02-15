import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

type MoodLog = { date: string; mood: number; emotion: string; activity?: string; description?: string };

type ContactPayload = {
  name: string;
  relation: string;
  lastInteraction: string | null;
  interactionCount: number;
  interactionsThisWeek: number;
  connectionLevel?: number;
  interactionDates: string[];
};

export default function Summary({ user }: { user: { uid: string } }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const moodSnap = await getDocs(collection(db, "users", user.uid, "moodLogs"));
        const moodLogs: MoodLog[] = moodSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            date: doc.id,
            mood: d.mood ?? 3,
            emotion: d.emotion ?? "",
            activity: d.activity,
            description: d.description,
          };
        });
        moodLogs.sort((a, b) => a.date.localeCompare(b.date));

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        const contactsSnap = await getDocs(collection(db, "users", user.uid, "contacts"));
        const contacts: ContactPayload[] = [];

        for (const contactDoc of contactsSnap.docs) {
          const c = contactDoc.data();
          const interactionsSnap = await getDocs(
            collection(db, "users", user.uid, "contacts", contactDoc.id, "interactions")
          );
          const interactionDates = interactionsSnap.docs.map((d) => d.id).sort();
          const interactionsThisWeek = interactionDates.filter((id) => new Date(id) >= weekAgo).length;

          contacts.push({
            name: c.name ?? "",
            relation: c.relation ?? "",
            lastInteraction: c.lastInteraction ?? null,
            interactionCount: interactionDates.length,
            interactionsThisWeek,
            connectionLevel: c.connectionLevel,
            interactionDates,
          });
        }

        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moodLogs,
            contacts,
            today: todayKey,
            totalLogCount: moodLogs.length,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as { summary?: string; error?: string; details?: string };
        if (cancelled) return;
        if (!res.ok) {
          const msg = data.error || data.details || "Couldn’t generate summary";
          throw new Error(msg);
        }
        setSummary(data.summary ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user.uid, retryKey]);

  const retry = () => {
    setError(null);
    setSummary(null);
    setLoading(true);
    setRetryKey((k) => k + 1);
  };

  if (loading) return <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm" />;
  if (error) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <p className="text-red-600 mb-2">{error}</p>
        <button type="button" onClick={retry} className="text-sm underline text-neutral-600 hover:text-neutral-900">
          Retry
        </button>
      </div>
    );
  }
  if (!summary) return <p className="text-neutral-500">No data yet — log some moods and add connections.</p>;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Summary</h2>
      <div className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{summary}</div>
    </div>
  );
}
