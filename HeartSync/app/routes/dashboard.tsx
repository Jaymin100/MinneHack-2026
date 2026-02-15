import { useState, useEffect } from "react";
import { auth, db } from "~/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import MoodLogger from "../components/MoodLogger";
import Summary from "../components/Summary";
import MoodCalendar from "../components/MoodCalendar";
import Connections from "../components/Connections";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [moodLoggedToday, setMoodLoggedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const moodDoc = await getDoc(doc(db, "users", u.uid, "moodLogs", today));
        setMoodLoggedToday(moodDoc.exists());
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  if (!user) return <p className="text-center mt-20">Please log in first.</p>;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 px-6 py-6 max-w-7xl mx-auto">
      <nav className="flex items-center justify-between mb-8">
        <span className="text-2xl font-bold tracking-tight">HeartSync Dashboard</span>
        <button
          onClick={() => auth.signOut()}
          className="px-4 py-2 border rounded-md hover:bg-neutral-100 transition"
        >
          Sign Out
        </button>
      </nav>

      {!moodLoggedToday && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
            <MoodLogger user={user} onLogged={() => setMoodLoggedToday(true)} />
          </div>
        </div>
      )}

      {moodLoggedToday && (
        <div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Summary user={user} />
            <MoodCalendar user={user} />
          </div>
          <Connections user={user} />
        </div>
      )}
    </div>
  );
}
