import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

type MoodLog = { date: string | { toDate: () => Date }; mood: number; emotion: string };

export default function Summary({ user }: any) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const moodLogsRef = collection(db, "users", user.uid, "moodLogs");
      const snapshot = await getDocs(moodLogsRef);
      const logs: MoodLog[] = [];
      snapshot.forEach((doc) => logs.push(doc.data() as MoodLog));

      if (logs.length === 0) return;

      const toDate = (d: MoodLog["date"]): Date =>
        typeof d === "string" ? new Date(d) : (d as { toDate: () => Date }).toDate();
      const dates = logs.map((l) => toDate(l.date)).sort((a, b) => a.getTime() - b.getTime());
      let streak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 3600 * 24);
        if (diff === 1) streak++;
        else break;
      }


      const avgMood = (logs.reduce((sum, l) => sum + l.mood, 0) / logs.length).toFixed(1);

  
      const emotionCount: any = {};
      logs.forEach((l) => (emotionCount[l.emotion] = (emotionCount[l.emotion] || 0) + 1));
      const mostCommonEmotion = (Object.entries(emotionCount) as [string, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      setStats({ streak, avgMood, mostCommonEmotion, totalLogins: logs.length });
    };

    fetchStats();
  }, [user]);

  if (!stats) return <p>Loading summary...</p>;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Summary</h2>
      <p>Streak: <strong>{stats.streak} days</strong></p>
      <p>Average Mood: <strong>{stats.avgMood}</strong></p>
      <p>Most Common Emotion: <strong>{stats.mostCommonEmotion}</strong></p>
      <p>Total Logins: <strong>{stats.totalLogins}</strong></p>
    </div>
  );
}
