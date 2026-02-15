import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

type Contact = {
  id: string;
  name: string;
  relation: string;
  connectionLevel?: number;
  lastInteraction?: string | null;
  photoURL?: string;
  interactionDates: string[];
};

export default function StatsDash({ user }: { user: any }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const contactSnap = await getDocs(collection(db, "users", user.uid, "contacts"));
      const list: Contact[] = [];
      for (const doc of contactSnap.docs) {
        const data = doc.data();
        const interactionsSnap = await getDocs(
          collection(db, "users", user.uid, "contacts", doc.id, "interactions")
        );
        const dates: string[] = [];
        interactionsSnap.forEach((d) => dates.push(d.id));
        dates.sort();
        list.push({
          id: doc.id,
          name: data.name ?? "",
          relation: data.relation ?? "",
          connectionLevel: data.connectionLevel ?? 5,
          lastInteraction: data.lastInteraction ?? null,
          photoURL: data.photoURL,
          interactionDates: dates,
        });
      }
      setContacts(list);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 p-8 border border-rose-100">
        <div className="h-8 bg-rose-200/50 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-rose-200/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const oneWeekAgo = Date.now() - oneWeekMs;
  const threeWeeksMs = 21 * 24 * 60 * 60 * 1000;

  const connectedThisWeek = contacts.filter((c) => {
    if (c.interactionDates.some((d) => new Date(d).getTime() >= oneWeekAgo)) return true;
    if (c.lastInteraction && new Date(c.lastInteraction).getTime() >= oneWeekAgo) return true;
    return false;
  });

  const needsAttention = contacts.filter((c) => {
    const level = c.connectionLevel ?? 5;
    if (level <= 2) return true;
    if (!c.lastInteraction) return true;
    return Date.now() - new Date(c.lastInteraction).getTime() > threeWeeksMs;
  });

  const strongConnections = contacts.filter((c) => (c.connectionLevel ?? 0) >= 7);
  const avgConnectionLevel =
    contacts.length > 0
      ? (contacts.reduce((s, c) => s + (c.connectionLevel ?? 5), 0) / contacts.length).toFixed(1)
      : "—";
  const mostInteracted =
    contacts.length > 0
      ? contacts.reduce((a, b) => (a.interactionDates.length >= b.interactionDates.length ? a : b))
      : null;

  const getLevelColor = (level: number) => {
    if (level <= 2) return "bg-red-500";
    if (level <= 4) return "bg-amber-500";
    if (level <= 6) return "bg-lime-500";
    return "bg-emerald-500";
  };

  const getLevelLabel = (level: number) => {
    if (level <= 2) return "Been awhile";
    if (level <= 4) return "Okay";
    if (level <= 6) return "Good";
    return "Great";
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50 p-8 border border-rose-100/80 shadow-lg shadow-rose-100/30">
      <h2 className="text-2xl font-bold text-neutral-800 mb-1 tracking-tight">Connection Stats</h2>
      <p className="text-neutral-500 text-sm mb-8">How you're staying connected</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-rose-100 shadow-sm">
          <p className="text-3xl font-bold text-neutral-800">{contacts.length}</p>
          <p className="text-sm text-neutral-500 mt-0.5">Total connections</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-emerald-100 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">{connectedThisWeek.length}</p>
          <p className="text-sm text-neutral-500 mt-0.5">Connected this week</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-amber-100 shadow-sm">
          <p className="text-3xl font-bold text-amber-600">{avgConnectionLevel}</p>
          <p className="text-sm text-neutral-500 mt-0.5">Avg connection level</p>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-rose-100 shadow-sm">
          <p className="text-3xl font-bold text-rose-600">{needsAttention.length}</p>
          <p className="text-sm text-neutral-500 mt-0.5">Been awhile</p>
        </div>
      </div>

      {mostInteracted && mostInteracted.interactionDates.length > 0 && (
        <div className="mb-10 p-4 rounded-xl bg-gradient-to-r from-rose-100/50 to-amber-100/50 border border-rose-200/50">
          <p className="text-sm font-medium text-neutral-600 mb-1">You said hi to the most</p>
          <p className="text-lg font-semibold text-neutral-800">
            {mostInteracted.name}
            <span className="text-neutral-500 font-normal"> — {mostInteracted.interactionDates.length} times</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">Your connections</h3>
        {contacts.length === 0 ? (
          <p className="text-neutral-500 py-8 text-center">Add contacts to see your connection stats</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts
              .sort((a, b) => (b.connectionLevel ?? 0) - (a.connectionLevel ?? 0))
              .map((c) => {
                const level = c.connectionLevel ?? 5;
                const isNeedsAttention = needsAttention.some((x) => x.id === c.id);
                const lastDate = c.interactionDates.length > 0
                  ? c.interactionDates[c.interactionDates.length - 1]
                  : c.lastInteraction;

                return (
                  <div
                    key={c.id}
                    className={`relative overflow-hidden rounded-xl p-5 border shadow-sm transition hover:shadow-md ${
                      isNeedsAttention ? "border-rose-200 bg-rose-50/50" : "border-neutral-200 bg-white"
                    }`}
                  >
                    {isNeedsAttention && (
                      <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        Been awhile
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-200">
                        {c.photoURL ? (
                          <img src={c.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg text-neutral-400">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-800 truncate">{c.name}</p>
                        <p className="text-sm text-neutral-500">{c.relation}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>{getLevelLabel(level)}</span>
                            <span>{level}/10</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getLevelColor(level)}`}
                              style={{ width: `${(level / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        {lastDate && (
                          <p className="text-xs text-neutral-400 mt-2">
                            Last: {new Date(lastDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
