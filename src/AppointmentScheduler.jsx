
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addMinutes, isBefore } from "date-fns";

const LOCAL_STORAGE_KEY = "appointment_data";

const AppointmentScheduler = () => {
  const [userRole, setUserRole] = useState(null); // null, 'server', 'dipendente'
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [availability, setAvailability] = useState([]);
  const [newAvailability, setNewAvailability] = useState({ date: "", start: "", end: "" });
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]); // { dateTime, name }

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const { availability, bookings } = JSON.parse(savedData);
      setAvailability(availability || []);
      setBookings(bookings || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ availability, bookings }));
  }, [availability, bookings]);

  const handleLogin = () => {
    if (password === "server123") {
      setUserRole("server");
    } else if (userName.trim() !== "") {
      setUserRole("dipendente");
    } else {
      alert("Inserisci il tuo nome per continuare");
    }
  };

  const addAvailability = () => {
    setAvailability([...availability, newAvailability]);
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

  const handleSlotBooking = (slot) => {
    const dateTime = `${selectedDate} ${slot}`;
    setBookings([...bookings, { dateTime, name: userName }]);
    alert(`Appuntamento prenotato per il ${dateTime}`);
  };

  const handleCancelBooking = (dateTime) => {
    const updatedBookings = bookings.filter(b => !(b.dateTime === dateTime && b.name === userName));
    setBookings(updatedBookings);
  };

  if (!userRole) {
    return (
      <div className="p-6 max-w-md mx-auto">
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
          <Input
            type="date"
            value={newAvailability.date}
            onChange={(e) => setNewAvailability({ ...newAvailability, date: e.target.value })}
            placeholder="Data"
          />
          <Input
            type="time"
            value={newAvailability.start}
            onChange={(e) => setNewAvailability({ ...newAvailability, start: e.target.value })}
            placeholder="Ora inizio"
          />
          <Input
            type="time"
            value={newAvailability.end}
            onChange={(e) => setNewAvailability({ ...newAvailability, end: e.target.value })}
            placeholder="Ora fine"
          />
          <Button onClick={addAvailability}>Aggiungi disponibilità</Button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Disponibilità attuali</h2>
        <ul className="mb-4">
          {availability.map((a, i) => (
            <li key={i}>{a.date} dalle {a.start} alle {a.end}</li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mb-2">Appuntamenti Prenotati</h2>
        <ul>
          {bookings.map((b, i) => (
            <li key={i}>{b.dateTime} - {b.name}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Dipendente
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Prenotazione Appuntamento</h1>

      <label className="block mb-2 font-medium">Scegli una data disponibile:</label>
      <select onChange={handleDateSelect} className="mb-4 p-2 border rounded">
        <option value="">-- Seleziona una data --</option>
        {availability.map((a) => (
          <option key={a.date} value={a.date}>{a.date}</option>
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
        {bookings.filter(b => b.name === userName).map((b, i) => (
          <li key={i} className="flex justify-between items-center mb-2">
            {b.dateTime}
            <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(b.dateTime)}>Annulla</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentScheduler;
