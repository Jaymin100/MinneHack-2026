import { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-lime-400", "bg-green-500"];
const EMOTIONS = ["Happy", "Sad", "Anxious", "Calm", "Excited", "Frustrated", "Grateful", "Tired", "Loving", "Hopeful"];

export default function MoodLogger({ user, onLogged }: any) {
  const [mood, setMood] = useState(3);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    // YYYY-MM-DD
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    await setDoc(doc(db, "users", user.uid, "moodLogs", today), {
      mood,
      emotion,
      activity,
      description,
      date: today, // store local date string
    });

    onLogged();
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Today's Mood</h2>

      <div className="flex gap-2">
        {colors.map((c, i) => (
          <div
            key={i}
            className={`${c} w-8 h-8 rounded-full cursor-pointer ${mood === i + 1 ? "ring-4 ring-neutral-900" : ""}`}
            onClick={() => setMood(i + 1)}
          />
        ))}
      </div>

      <select
        className="border rounded-md px-3 py-2 w-full bg-white"
        value={emotion}
        onChange={(e) => setEmotion(e.target.value)}
      >
        {EMOTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Activity (max 50 chars)"
        maxLength={50}
        className="border rounded-md px-3 py-2 w-full"
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
      />
      <textarea
        placeholder="Why do you feel this way? (max 300 chars)"
        maxLength={300}
        className="border rounded-md px-3 py-2 w-full"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition mt-2"
      >
        Log Mood
      </button>
    </div>
  );
}
