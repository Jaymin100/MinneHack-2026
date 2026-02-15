import { useEffect, useState } from "react";
import { db } from "~/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function Connections({ user }: any) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    relation: "",
    photoFile: null as File | null,
    connectionLevel: 5,
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  useEffect(() => {
    const fetchContacts = async () => {
      const snapshot = await getDocs(collection(db, "users", user.uid, "contacts"));
      const list: any[] = [];
      for (const contactDoc of snapshot.docs) {
        const data = contactDoc.data();
        const interactionsRef = collection(db, "users", user.uid, "contacts", contactDoc.id, "interactions");
        const interactionsSnap = await getDocs(interactionsRef);
        const interactionDates: string[] = [];
        interactionsSnap.forEach((d) => interactionDates.push(d.id));
        interactionDates.sort();
        list.push({ id: contactDoc.id, ...data, interactionDates });
      }
      setContacts(list);
    };
    fetchContacts();
  }, [user]);

  const handleAddContact = async () => {
    let photoData = "";
    if (newContact.photoFile) {
      photoData = await fileToBase64(newContact.photoFile);
    }

    const id = Date.now().toString();
    const contactData = {
      name: newContact.name,
      relation: newContact.relation,
      connectionLevel: newContact.connectionLevel,
      photoURL: photoData,
      lastUpdated: new Date().toISOString(),
      lastInteraction: null,
    };

    await setDoc(doc(db, "users", user.uid, "contacts", id), contactData);
    setContacts([...contacts, { id, ...contactData }]);
    setShowModal(false);
    setNewContact({ name: "", relation: "", photoFile: null, connectionLevel: 5 });
  };

  const getColorAndLabel = (level: number) => {
    if (level <= 2) return { color: "#f56565", label: "Been awhile" };
    if (level <= 4) return { color: "#ed8936", label: "Okay" };
    if (level <= 6) return { color: "#68d391", label: "Good" };
    return { color: "#48bb78", label: "Great" };
  };

  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const updateConnectionLevel = async (contact: any, level: number) => {
    const docRef = doc(db, "users", user.uid, "contacts", contact.id);
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, connectionLevel: level, lastUpdated: new Date().toISOString() } : c))
    );
    await setDoc(docRef, { connectionLevel: level, lastUpdated: new Date().toISOString() }, { merge: true });
  };

  const toggleInteraction = async (contact: any) => {
    const interactedToday =
      contact.lastInteraction &&
      new Date(contact.lastInteraction).toDateString() === new Date().toDateString();

    const updatedValue = interactedToday ? null : new Date().toISOString();
    const docRef = doc(db, "users", user.uid, "contacts", contact.id);
    const todayKey = getTodayKey();
    const interactionRef = doc(db, "users", user.uid, "contacts", contact.id, "interactions", todayKey);

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contact.id) return c;
        const dates = [...(c.interactionDates || [])];
        if (interactedToday) {
          const idx = dates.indexOf(todayKey);
          if (idx >= 0) dates.splice(idx, 1);
        } else {
          if (!dates.includes(todayKey)) dates.push(todayKey);
          dates.sort();
        }
        return { ...c, lastInteraction: updatedValue, lastUpdated: new Date().toISOString(), interactionDates: dates };
      })
    );

    if (interactedToday) {
      await deleteDoc(interactionRef);
    } else {
      await setDoc(interactionRef, { date: todayKey });
    }
    await setDoc(docRef, { lastInteraction: updatedValue, lastUpdated: new Date().toISOString() }, { merge: true });
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4">Connections</h2>

      <div className="grid md:grid-cols-4 gap-6">
        {contacts.map((c) => {
          const { color, label } = getColorAndLabel(c.connectionLevel);
          const interactedToday =
            c.lastInteraction &&
            new Date(c.lastInteraction).toDateString() === new Date().toDateString();

          return (
            <div
              key={c.id}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-lg flex flex-col items-center gap-3 hover:scale-105 transform transition"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200">
                {c.photoURL ? (
                  <img src={c.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400">
                    No Photo
                  </div>
                )}
              </div>

              <span className="font-medium text-lg">{c.name}</span>
              <span className="text-sm text-neutral-500">{c.relation}</span>

              <div className="w-full mt-2">
                <div className="flex justify-between mb-1 text-sm text-neutral-600">
                  <span>How connected do you feel?</span>
                  <span>{label}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={c.connectionLevel ?? 5}
                  onChange={(e) => updateConnectionLevel(c, parseInt(e.target.value))}
                  className="w-full h-2 accent-neutral-900 cursor-pointer"
                />
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-1">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${((c.connectionLevel ?? 5) / 10) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>

              {c.lastInteraction && (
                <span className="text-xs text-neutral-400 mt-1">
                  Last interacted with: {new Date(c.lastInteraction).toLocaleDateString()}
                </span>
              )}

              {c.interactionDates && c.interactionDates.length > 0 && (
                <span className="text-xs text-neutral-500 mt-0.5">
                  Interacted on: {c.interactionDates.slice(-5).reverse().map((dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })).join(", ")}
                  {c.interactionDates.length > 5 ? ` (+${c.interactionDates.length - 5} more)` : ""}
                </span>
              )}

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interactedToday}
                  onChange={() => toggleInteraction(c)}
                  id={`interaction-${c.id}`}
                  className="w-4 h-4 accent-neutral-900 cursor-pointer"
                />
                <label
                  htmlFor={`interaction-${c.id}`}
                  className="text-sm text-neutral-600 cursor-pointer"
                >
                  Interacted today
                </label>
              </div>
            </div>
          );
        })}

        <div
          onClick={() => setShowModal(true)}
          className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 hover:scale-105 transform transition"
        >
          <span className="text-4xl font-bold">+</span>
          <span className="mt-2 text-sm font-medium">Add Contact</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-800 transition"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4 text-center">Add New Contact</h3>

            <input
              type="text"
              placeholder="Name"
              className="border border-neutral-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            />

            <input
              type="text"
              placeholder="Relation (friend, family, coworker)"
              className="border border-neutral-300 rounded-md px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              value={newContact.relation}
              onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
            />

            <div className="mb-4 w-full">
              <label className="block mb-1 text-sm font-medium">Upload Photo</label>
              <div className="relative flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  id="photo-upload"
                  className="hidden"
                  onChange={(e) =>
                    setNewContact({ ...newContact, photoFile: e.target.files?.[0] || null })
                  }
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition inline-block"
                >
                  {newContact.photoFile ? "Change Photo" : "Choose Photo"}
                </label>
                {newContact.photoFile && (
                  <span className="text-sm text-neutral-600 truncate">{newContact.photoFile.name}</span>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                How connected do you feel?{" "}
                {newContact.connectionLevel <= 2
                  ? "Been awhile"
                  : newContact.connectionLevel <= 4
                  ? "Okay"
                  : newContact.connectionLevel <= 6
                  ? "Good"
                  : "Great"}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={newContact.connectionLevel}
                onChange={(e) =>
                  setNewContact({ ...newContact, connectionLevel: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <button
              onClick={handleAddContact}
              className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition w-full"
            >
              Add Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
