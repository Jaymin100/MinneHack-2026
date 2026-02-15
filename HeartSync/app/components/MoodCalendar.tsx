import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db } from "~/firebase";
import { ymd } from "~/utils/date";
import { collection, getDocs } from "firebase/firestore";

const moodColors: Record<number, string> = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#84cc16", 5: "#22c55e" };

export default function MoodCalendar({ user }: { user: { uid: string } }) {
  const [logs, setLogs] = useState<Record<string, { mood: number; emotion?: string; activity?: string; description?: string }>>({});
  const [date, setDate] = useState<Date | null>(null);

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

  const key = date ? ymd(date) : null;
  const log = key ? logs[key] : null;

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <Calendar
        value={date ?? undefined}
        onChange={(v) => setDate(Array.isArray(v) ? v[0] ?? null : v ?? null)}
        tileContent={({ date: d }) => {
          const k = ymd(d);
          const l = logs[k];
          if (!l) return null;
          return (
            <span
              style={{ display: "block", width: 4, height: 4, borderRadius: 2, backgroundColor: moodColors[l.mood], margin: "0 auto" }}
            />
          );
        }}
      />
      {log && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className="font-medium">{log.mood}/5 {log.emotion || ""}</p>
          {log.activity && <p>{log.activity}</p>}
          {log.description && <p className="text-gray-600">{log.description}</p>}
        </div>
      )}
    </div>
  );
}
