"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Shift = {
  id: string;
  user_id: string;
  employer: string;
  date: string;
  start_time: string;
  end_time: string;
  pause: boolean;
  hourly_rate: number;
  tips: number;
  hours: number;
  wage: number;
  created_at: string;
};

export default function Home() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadShifts() {
      setLoading(true);
      setErrorMessage("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Fehler beim Laden des Benutzers:", userError);
        setErrorMessage(`Benutzerfehler: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMessage("Du bist nicht angemeldet.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("shifts")
        .select(
          `
          id,
          user_id,
          employer,
          date,
          start_time,
          end_time,
          pause,
          hourly_rate,
          tips,
          hours,
          wage,
          created_at
        `
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Fehler beim Laden der Schichten:", error);

        setErrorMessage(
          `Die Schichten konnten nicht geladen werden: ${error.message}`
        );

        setShifts([]);
      } else {
        setShifts((data ?? []) as Shift[]);
      }

      setLoading(false);
    }

    loadShifts();
  }, []);

  const currentMonthShifts = useMemo(() => {
    const now = new Date();

    return shifts.filter((shift) => {
      const shiftDate = new Date(`${shift.date}T12:00:00`);

      return (
        shiftDate.getMonth() === now.getMonth() &&
        shiftDate.getFullYear() === now.getFullYear()
      );
    });
  }, [shifts]);

  const totalHours = currentMonthShifts.reduce(
    (sum, shift) => sum + Number(shift.hours ?? 0),
    0
  );

  const totalWage = currentMonthShifts.reduce(
    (sum, shift) => sum + Number(shift.wage ?? 0),
    0
  );

  const totalTips = currentMonthShifts.reduce(
    (sum, shift) => sum + Number(shift.tips ?? 0),
    0
  );

  const totalIncome = totalWage + totalTips;

  const monthName = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Dashboard wird geladen …</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm capitalize text-slate-400">{monthName}</p>

        <h1 className="mt-2 text-4xl font-bold">Dashboard</h1>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-slate-900 p-6">
            <p className="text-slate-400">Gesamteinnahmen</p>

            <p className="mt-3 text-3xl font-semibold">
              {totalIncome.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6">
            <p className="text-slate-400">Arbeitsstunden</p>

            <p className="mt-3 text-3xl font-semibold">
              {totalHours.toFixed(2)} h
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6">
            <p className="text-slate-400">Grundlohn</p>

            <p className="mt-3 text-3xl font-semibold">
              {totalWage.toFixed(2)} €
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6">
            <p className="text-slate-400">Trinkgeld</p>

            <p className="mt-3 text-3xl font-semibold">
              {totalTips.toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-900 p-6">
          <p className="text-slate-400">Schichten in diesem Monat</p>

          <p className="mt-3 text-3xl font-semibold">
            {currentMonthShifts.length}
          </p>
        </div>
      </div>
    </main>
  );
}