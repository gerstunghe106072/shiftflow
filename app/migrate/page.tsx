"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LocalShift = {
  id: string;
  employer: string;
  date: string;
  start: string;
  end: string;
  pause: boolean;
  hourlyRate: number;
  tips: number;
  hours: number;
  wage: number;
};

export default function MigratePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function migrateShifts() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Du musst zuerst angemeldet sein.");
        return;
      }

      const localShifts: LocalShift[] = JSON.parse(
        localStorage.getItem("shifts") || "[]"
      );

      if (localShifts.length === 0) {
        setMessage("Es wurden keine lokalen Schichten gefunden.");
        return;
      }

      const rows = localShifts.map((shift) => ({
        id: shift.id,
        user_id: user.id,
        employer: shift.employer,
        date: shift.date,
        start_time: shift.start,
        end_time: shift.end,
        pause: shift.pause,
        hourly_rate: shift.hourlyRate,
        tips: shift.tips,
        hours: shift.hours,
        wage: shift.wage,
      }));

      const { error } = await supabase
        .from("shifts")
        .upsert(rows, { onConflict: "id" });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        `${localShifts.length} Schichten wurden erfolgreich gespeichert.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Migration ist fehlgeschlagen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="rounded-3xl bg-slate-900 p-7">
        <h1 className="text-3xl font-bold">
          Schichten ins Konto übertragen
        </h1>

        <p className="mt-3 text-slate-400">
          Deine bisher lokal gespeicherten Schichten werden einmalig in dein
          angemeldetes Konto kopiert.
        </p>

        <button
          onClick={migrateShifts}
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Wird übertragen …" : "Schichten übertragen"}
        </button>

        {message && (
          <p className="mt-5 rounded-xl bg-slate-800 p-4">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}