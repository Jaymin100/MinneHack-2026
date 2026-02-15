import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function StatsDash({ user }: { user: { uid: string } }) {
  const [contacts, setContacts] = useState<{ id: string; name: string; relation: string; connectionLevel: number; lastInteraction: string | null; interactionDates: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "users", user.uid, "contacts")).then(async (snap) => {
      const list: any[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const intSnap = await getDocs(collection(db, "users", user.uid, "contacts", d.id, "interactions"));
        const dates = intSnap.docs.map((x) => x.id).sort();
        list.push({
          id: d.id,
          name: data.name ?? "",
          relation: data.relation ?? "",
          connectionLevel: data.connectionLevel ?? 5,
          lastInteraction: data.lastInteraction ?? null,
          interactionDates: dates,
        });
      }
      setContacts(list);
      setLoading(false);
    });
  }, [user.uid]);

  if (loading) return <div className="bg-white border border-gray-200 rounded p-4">...</div>;

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekAgo = Date.now() - weekMs;
  const thisWeek = contacts.filter((c) => c.interactionDates.some((d) => new Date(d).getTime() >= weekAgo) || (c.lastInteraction && new Date(c.lastInteraction).getTime() >= weekAgo)).length;
  const needNudge = contacts.filter((c) => (c.connectionLevel <= 2) || !c.lastInteraction || (Date.now() - new Date(c.lastInteraction).getTime() > 21 * 24 * 60 * 60 * 1000)).length;
  const avg = contacts.length ? (contacts.reduce((s, c) => s + c.connectionLevel, 0) / contacts.length).toFixed(1) : "—";
  const most = contacts.length ? contacts.reduce((a, b) => (a.interactionDates.length >= b.interactionDates.length ? a : b)) : null;

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h2 className="text-sm font-semibold mb-3">Stats</h2>
      <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
        <div className="border border-gray-200 rounded p-2"><span className="font-semibold">{contacts.length}</span><br /><span className="text-gray-500">contacts</span></div>
        <div className="border border-gray-200 rounded p-2"><span className="font-semibold">{thisWeek}</span><br /><span className="text-gray-500">this week</span></div>
        <div className="border border-gray-200 rounded p-2"><span className="font-semibold">{avg}</span><br /><span className="text-gray-500">avg level</span></div>
        <div className="border border-gray-200 rounded p-2"><span className="font-semibold">{needNudge}</span><br /><span className="text-gray-500">nudge</span></div>
      </div>
      {most && most.interactionDates.length > 0 && <p className="text-xs text-gray-600 mb-2">Most check-ins: {most.name} ({most.interactionDates.length})</p>}
      <div className="space-y-1">
        {contacts.sort((a, b) => b.connectionLevel - a.connectionLevel).map((c) => (
          <div key={c.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded text-sm">
            <span className="font-medium w-24 truncate">{c.name}</span>
            <span className="text-gray-500 text-xs">{c.relation}</span>
            <span className="text-xs">{c.connectionLevel}/10</span>
            {c.lastInteraction && <span className="text-xs text-gray-400">last {new Date(c.lastInteraction).toLocaleDateString()}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
