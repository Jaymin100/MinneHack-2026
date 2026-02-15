import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

const moodColors = ["#f56565", "#ed8936", "#ecc94b", "#9ae6b4", "#48bb78"]; // 1-red → 5-green

export default function MoodCalendar({ user }: any) {
  const [moodLogs, setMoodLogs] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, "users", user.uid, "moodLogs"));
      const logs: Record<string, { mood: number; emotion?: string; activity?: string; description?: string }> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        const key = typeof data.date === "string" ? data.date : d.id;
        logs[key] = { mood: data.mood, emotion: data.emotion, activity: data.activity, description: data.description };
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
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const log = moodLogs[dateKey];
          const mood = log?.mood;
          const isSelected = selectedDate === dateKey;
          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(dateKey)}
              className={`h-10 flex justify-center items-center rounded-md cursor-pointer transition ${
                mood ? "text-white font-bold hover:opacity-90" : "text-neutral-400 hover:bg-neutral-100"
              } ${isSelected ? "ring-2 ring-neutral-900 ring-offset-2" : ""}`}
              style={{
                backgroundColor: mood ? moodColors[mood - 1] : "transparent",
                border: "1px solid #ddd",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
          {moodLogs[selectedDate] ? (
            <div className="text-sm">
              <p className="font-semibold text-neutral-800 mb-1">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-neutral-600">
                Mood: <span className="font-medium">{moodLogs[selectedDate].mood}/5</span>
                {moodLogs[selectedDate].emotion && (
                  <> · Emotion: <span className="font-medium">{moodLogs[selectedDate].emotion}</span></>
                )}
              </p>
              {moodLogs[selectedDate].activity && (
                <p className="text-neutral-600 mt-1">Activity: {moodLogs[selectedDate].activity}</p>
              )}
              {moodLogs[selectedDate].description && (
                <p className="text-neutral-600 mt-1">{moodLogs[selectedDate].description}</p>
              )}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No mood logged for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
