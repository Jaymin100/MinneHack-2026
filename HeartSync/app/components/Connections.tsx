import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { ymd } from "~/utils/date";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function Connections({ user }: { user: { uid: string } }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newLevel, setNewLevel] = useState(5);

  useEffect(() => {
    getDocs(collection(db, "users", user.uid, "contacts")).then(async (snap) => {
      const list: any[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const intSnap = await getDocs(collection(db, "users", user.uid, "contacts", d.id, "interactions"));
        list.push({ id: d.id, ...data, interactionDates: intSnap.docs.map((x) => x.id).sort() });
      }
      setContacts(list);
    });
  }, [user.uid]);

  async function addContact() {
    const id = Date.now().toString();
    await setDoc(doc(db, "users", user.uid, "contacts", id), {
      name: newName,
      relation: newRelation,
      connectionLevel: newLevel,
      lastInteraction: null,
    });
    setContacts([...contacts, { id, name: newName, relation: newRelation, connectionLevel: newLevel, lastInteraction: null, interactionDates: [] }]);
    setModal(false);
    setNewName("");
    setNewRelation("");
    setNewLevel(5);
  }

  async function setLevel(c: any, level: number) {
    await setDoc(doc(db, "users", user.uid, "contacts", c.id), { connectionLevel: level }, { merge: true });
    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, connectionLevel: level } : x)));
  }

  async function toggleToday(c: any) {
    const today = ymd();
    const interacted = c.lastInteraction && new Date(c.lastInteraction).toDateString() === new Date().toDateString();
    const ref = doc(db, "users", user.uid, "contacts", c.id, "interactions", today);
    if (interacted) await deleteDoc(ref);
    else await setDoc(ref, { date: today });
    const nextVal = interacted ? null : new Date().toISOString();
    await setDoc(doc(db, "users", user.uid, "contacts", c.id), { lastInteraction: nextVal }, { merge: true });
    setContacts((prev) =>
      prev.map((x) => {
        if (x.id !== c.id) return x;
        const dates = interacted ? (x.interactionDates || []).filter((d: string) => d !== today) : [...(x.interactionDates || []), today].sort();
        return { ...x, lastInteraction: nextVal, interactionDates: dates };
      })
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold mb-3">Connections</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {contacts.map((c) => {
          const didToday = c.lastInteraction && new Date(c.lastInteraction).toDateString() === new Date().toDateString();
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded p-3">
              <p className="font-medium text-sm truncate">{c.name}</p>
              <p className="text-xs text-gray-500">{c.relation}</p>
              <p className="text-xs mt-1">{c.connectionLevel ?? 5}/10</p>
              <input type="range" min={1} max={10} value={c.connectionLevel ?? 5} onChange={(e) => setLevel(c, +e.target.value)} className="w-full h-1 mt-0.5" />
              {c.lastInteraction && <p className="text-xs text-gray-400 mt-1">Last: {new Date(c.lastInteraction).toLocaleDateString()}</p>}
              <label className="flex items-center gap-1 mt-2 text-xs cursor-pointer">
                <input type="checkbox" checked={!!didToday} onChange={() => toggleToday(c)} />
                Check in today
              </label>
            </div>
          );
        })}
        <button type="button" onClick={() => setModal(true)} className="border border-gray-200 rounded p-4 flex items-center justify-center text-gray-500 hover:bg-gray-50 min-h-[100px]">
          +
        </button>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-xs">
            <button type="button" onClick={() => setModal(false)} className="float-right text-gray-500">✕</button>
            <h3 className="text-sm font-semibold mb-2">Add</h3>
            <input type="text" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full text-sm mb-2" />
            <input type="text" placeholder="Relation" value={newRelation} onChange={(e) => setNewRelation(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full text-sm mb-2" />
            <p className="text-xs text-gray-500 mb-1">Level {newLevel}/10</p>
            <input type="range" min={1} max={10} value={newLevel} onChange={(e) => setNewLevel(+e.target.value)} className="w-full mb-3" />
            <button type="button" onClick={addContact} className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded w-full">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
