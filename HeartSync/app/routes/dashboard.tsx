import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { auth, db } from "~/firebase";
import { ymd } from "~/utils/date";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import MoodLogger from "../components/MoodLogger";
import Summary from "../components/Summary";
import MoodCalendar from "../components/MoodCalendar";
import Connections from "../components/Connections";
import StatsDashComponent from "../components/StatsDash";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [moodLoggedToday, setMoodLoggedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const today = ymd();
        const moodDoc = await getDoc(doc(db, "users", u.uid, "moodLogs", today));
        setMoodLoggedToday(moodDoc.exists());
      } else setUser(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p className="text-center py-16 text-gray-500">Loading...</p>;
  if (!user) return <p className="text-center py-16 text-gray-500">Log in first.</p>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <span className="font-semibold">HeartSync</span>
          <button type="button" onClick={() => { auth.signOut(); navigate("/"); }} className="text-sm text-gray-600">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {!moodLoggedToday ? (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-sm">
              <MoodLogger user={user} onLogged={() => setMoodLoggedToday(true)} />
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Summary user={user} />
              <MoodCalendar user={user} />
            </div>
            <div className="mb-6">
              <StatsDashComponent user={user} />
            </div>
            <Connections user={user} />
          </>
        )}
      </main>
    </div>
  );
}
