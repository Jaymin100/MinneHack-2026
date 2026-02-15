import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { auth, db } from "~/firebase";
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50/40 text-neutral-900">
      <header className="sticky top-0 z-40 w-full border-b border-sky-200 bg-sky-100/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/HeartLogo.png" alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-contain" />
            <span className="text-xl font-bold tracking-tight text-sky-900">HeartSync Dashboard</span>
          </div>
          <button
            type="button"
            onClick={() => { auth.signOut(); navigate("/"); }}
            className="rounded-lg border border-sky-300 bg-white/80 px-4 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
      {!moodLoggedToday ? (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
            <MoodLogger user={user} onLogged={() => setMoodLoggedToday(true)} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Summary user={user} />
            <MoodCalendar user={user} />
          </div>
          <div className="mb-8">
            <StatsDashComponent user={user} />
          </div>
          <Connections user={user} />
        </>
      )}
      </main>
    </div>
  );
}

