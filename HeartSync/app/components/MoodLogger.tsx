import { useState } from "react";
import { db } from "../firebase";
import { ymd } from "../utils/date";
import { doc, setDoc } from "firebase/firestore";

const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const EMOTIONS = ["Happy", "Sad", "Anxious", "Calm", "Excited", "Frustrated", "Grateful", "Tired", "Loving", "Hopeful"];

export default function MoodLogger({ user, onLogged }: { user: { uid: string }; onLogged: () => void }) {
  const [mood, setMood] = useState(3);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    const today = ymd();
    await setDoc(doc(db, "users", user.uid, "moodLogs", today), { mood, emotion, activity, description: notes, date: today });
    onLogged();
  }

  return (
    <div className="border border-gray-200 rounded p-4">
      <h2 className="text-sm font-semibold mb-3">Today</h2>
      <div className="flex gap-1 mb-3">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setMood(i + 1)}
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: mood === i + 1 ? c : "transparent" }}
          />
        ))}
      </div>
      <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full text-sm mb-2">
        {EMOTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <input type="text" placeholder="Activity" maxLength={50} value={activity} onChange={(e) => setActivity(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full text-sm mb-2" />
      <textarea placeholder="Notes" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full text-sm mb-3" rows={2} />
      <button type="button" onClick={submit} className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded">Save</button>
    </div>
  );
}
