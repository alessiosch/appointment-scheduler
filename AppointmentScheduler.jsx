import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addMinutes, isBefore } from "date-fns";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5VH6S1cdOjAyJAHucBb-YvcmlWZlCgSU",
  authDomain: "iwalter.firebaseapp.com",
  projectId: "iwalter",
  storageBucket: "iwalter.firebasestorage.app",
  messagingSenderId: "801990555301",
  appId: "1:801990555301:web:cc3ff89560a7045edc3f4c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AppointmentScheduler = () => {
  const [userRole, setUserRole] = useState(null);
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [availability, setAvailability] = useState([]);
  const [newAvailability, setNewAvailability] = useState({ date: "", start: "", end: "" });
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const unsubAvail = onSnapshot(collection(db, "availability"), (snapshot) => {
      setAvailability(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBook = onSnapshot(collection(db, "bookings"), (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAvail();
      unsubBook();
    };
  }, []);

  const handleLogin = () => {
    if (password === "server123") {
      setUserRole("server");
    } else if (userName.trim() !== "") {
      setUserRole("dipendente");
    } else {
      alert("Inserisci il tuo nome per continuare");
    }
  };

  const addAvailability = async () => {
    await addDoc(collection(db, "availability"), newAvailability);
    setNewAvailability({ date: "", start: "", end: "" });
  };

  const generateSlots = (date) => {
    const giorno = availability.find((a) => a.date === date);
    if (!giorno) return [];

    const start = new Date(`${giorno.date}T${giorno.start}`);
    const end = new Date(`${giorno.date}T${giorno.end}`);
    const slotList = [];

    let current = start;
    while (isBefore(current, end)) {
      slotList.push(format(current, "HH:mm"));
      current = addMinutes(current, 15);
    }
    return slotList.filter(slot => !bookings.find(b => b.dateTime === `${date} ${slot}`));
  };

  const handleDateSelect = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSlots(generateSlots(date));
  };

  const handleSlotBooking = async (slot) => {
    const dateTime = `${selectedDate} ${slot}`;
    await addDoc(collection(db, "bookings"), { dateTime, name: userName });
    alert(`Appuntamento prenotato per il ${dateTime}`);
  };

  const handleCancelBooking = async (id) => {
    await deleteDoc(doc(db, "bookings", id));
  };

  if (!userRole) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="text-4xl font-extrabold mb-2 text-blue-600">iWalter</div>
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <Input
          type="text"
          placeholder="Nome dipendente"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="mb-2"
        />
        <Input
          type="password"
          placeholder="Password (server123 per il server)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleLogin}>Accedi</Button>
      </div>
    );
  }

  if (userRole === "server") {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Gestione Disponibilità (Server)</h1>

        <div className="grid gap-2 mb-4">
          <Input type="date" value={newAvailability.date} onChange={(e) => setNewAvailability({ ...newAvailability, date: e.target.value })} />
          <Input type="time" value={newAvailability.start} onChange={(e) => setNewAvailability({ ...newAvailability, start: e.target.value })} />
          <Input type="time" value={newAvailability.end} onChange={(e) => setNewAvailability({ ...newAvailability, end: e.target.value })} />
          <Button onClick={addAvailability}>Aggiungi disponibilità</Button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Disponibilità attuali</h2>
        <ul className="mb-4">
          {availability.map((a) => (
            <li key={a.id}>{a.date} dalle {a.start} alle {a.end}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mb-2">Appuntamenti Prenotati</h2>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>{b.dateTime} - {b.name}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Prenotazione Appuntamento</h1>

      <label className="block mb-2 font-medium">Scegli una data disponibile:</label>
      <select onChange={handleDateSelect} className="mb-4 p-2 border rounded">
        <option value="">-- Seleziona una data --</option>
        {availability.map((a) => (
          <option key={a.id} value={a.date}>{a.date}</option>
        ))}
      </select>

      {selectedDate && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Orari disponibili</h2>
          <div className="grid grid-cols-3 gap-2">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <Card key={slot} className="cursor-pointer hover:bg-gray-100" onClick={() => handleSlotBooking(slot)}>
                  <CardContent className="p-2 text-center">{slot}</CardContent>
                </Card>
              ))
            ) : (
              <p>Nessuno slot disponibile per questa data.</p>
            )}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">I tuoi appuntamenti</h2>
      <ul>
        {bookings.filter(b => b.name === userName).map((b) => (
          <li key={b.id} className="flex justify-between items-center mb-2">
            {b.dateTime}
            <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(b.id)}>Annulla</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentScheduler;
