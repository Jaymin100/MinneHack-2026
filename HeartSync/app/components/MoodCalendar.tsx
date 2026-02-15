import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

const moodColors = ["#f56565", "#ed8936", "#ecc94b", "#9ae6b4", "#48bb78"]; // 1-red → 5-green

export default function MoodCalendar({ user }: any) {
  const [moodLogs, setMoodLogs] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, "users", user.uid, "moodLogs"));
      const logs: any = {};
      snapshot.forEach((doc) => {
        logs[doc.data().date] = doc.data().mood;
      });
      setMoodLogs(logs);
    };

    fetchLogs();
  }, [user]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };


  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 border rounded hover:bg-neutral-100 transition"
        >
          Prev
        </button>
        <span className="text-lg font-semibold">{monthNames[month]} {year}</span>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 border rounded hover:bg-neutral-100 transition"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center font-medium text-neutral-500 text-sm mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysArray.map((day, idx) => {
          if (!day) return <div key={idx} />; 
          const dateKey = new Date(year, month, day).toISOString().split("T")[0];
          const mood = moodLogs[dateKey];
          return (
            <div
              key={idx}
              className={`h-10 flex justify-center items-center rounded-md cursor-pointer ${
                mood ? "text-white font-bold" : "text-neutral-400"
              }`}
              style={{
                backgroundColor: mood ? moodColors[mood - 1] : "transparent",
                border: "1px solid #ddd",
              }}
              title={mood ? `Mood: ${mood}` : "No mood logged"}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
