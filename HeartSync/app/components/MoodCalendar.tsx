import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

const moodColors: Record<number, string> = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#84cc16", 5: "#22c55e" };
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

export default function MoodCalendar({ user }: { user: { uid: string } }) {
  const [logs, setLogs] = useState<Record<string, { mood: number; emotion?: string; activity?: string; description?: string }>>({});
  const [month, setMonth] = useState(new Date());
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, "users", user.uid, "moodLogs")).then((snap) => {
      const o: Record<string, any> = {};
      snap.forEach((d) => {
        const data = d.data();
        o[d.id] = { mood: data.mood, emotion: data.emotion, activity: data.activity, description: data.description };
      });
      setLogs(o);
    });
  }, [user.uid]);

  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => setMonth(new Date(y, m - 1, 1))} className="text-sm px-2 py-0.5 border rounded">Prev</button>
        <span className="text-sm font-medium">{MONTHS[m]} {y}</span>
        <button type="button" onClick={() => setMonth(new Date(y, m + 1, 1))} className="text-sm px-2 py-0.5 border rounded">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-xs text-gray-500 mb-1">
        {"S M T W T F S".split(" ").map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const log = logs[key];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel(key)}
              className="h-7 rounded text-xs"
              style={{ backgroundColor: log?.mood ? moodColors[log.mood] : "#f3f4f6", color: log?.mood ? "#fff" : "#9ca3af" }}
            >
              {day}
            </button>
          );
        })}
      </div>
      {sel && logs[sel] && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className="font-medium">{logs[sel].mood}/5 {logs[sel].emotion || ""}</p>
          {logs[sel].activity && <p>{logs[sel].activity}</p>}
          {logs[sel].description && <p className="text-gray-600">{logs[sel].description}</p>}
        </div>
      )}
    </div>
  );
}
