"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  created_at?: string;
};

type MonthlyPayout = {
  user_id: string;
  year: number;
  month: number;
  amount: number;
  updated_at?: string;
};

type BackupFile = {
  version: 1;
  createdAt: string;
  shifts: Shift[];
  monthlyPayouts: MonthlyPayout[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown) {
  return Number.isFinite(Number(value));
}

function isShift(value: unknown): value is Shift {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.employer === "string" &&
    typeof value.date === "string" &&
    typeof value.start_time === "string" &&
    typeof value.end_time === "string" &&
    typeof value.pause === "boolean" &&
    isFiniteNumber(value.hourly_rate) &&
    isFiniteNumber(value.tips) &&
    isFiniteNumber(value.hours) &&
    isFiniteNumber(value.wage)
  );
}

function isMonthlyPayout(value: unknown): value is MonthlyPayout {
  if (!isRecord(value)) return false;

  return (
    typeof value.user_id === "string" &&
    isFiniteNumber(value.year) &&
    isFiniteNumber(value.month) &&
    isFiniteNumber(value.amount)
  );
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.shifts) &&
    value.shifts.every(isShift) &&
    Array.isArray(value.monthlyPayouts) &&
    value.monthlyPayouts.every(isMonthlyPayout)
  );
}

export default function ExportPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [monthlyPayouts, setMonthlyPayouts] = useState<MonthlyPayout[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage("");

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setMessage("Du bist nicht angemeldet.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [shiftResult, payoutResult] = await Promise.all([
        supabase
          .from("shifts")
          .select(
            "id,user_id,employer,date,start_time,end_time,pause,hourly_rate,tips,hours,wage,created_at"
          )
          .eq("user_id", user.id)
          .order("date", { ascending: true }),
        supabase
          .from("monthly_payouts")
          .select("user_id,year,month,amount,updated_at")
          .eq("user_id", user.id)
          .order("year", { ascending: true })
          .order("month", { ascending: true }),
      ]);

      if (!active) return;

      if (shiftResult.error || payoutResult.error) {
        setMessage(
          shiftResult.error?.message ??
            payoutResult.error?.message ??
            "Die Exportdaten konnten nicht geladen werden."
        );
      }

      setShifts((shiftResult.data ?? []) as Shift[]);
      setMonthlyPayouts((payoutResult.data ?? []) as MonthlyPayout[]);
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const monthShifts = useMemo(() => {
    return shifts
      .filter((shift) => {
        const shiftDate = new Date(`${shift.date}T12:00:00`);

        return (
          shiftDate.getMonth() === selectedMonth.getMonth() &&
          shiftDate.getFullYear() === selectedMonth.getFullYear()
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, selectedMonth]);

  const payoutByMonth = useMemo(() => {
    return new Map(
      monthlyPayouts.map((payout) => [
        `${Number(payout.year)}-${Number(payout.month)}`,
        Number(payout.amount),
      ])
    );
  }, [monthlyPayouts]);

  const totalHours = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.hours),
    0
  );
  const totalWage = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.wage),
    0
  );
  const totalTips = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.tips),
    0
  );
  const totalIncome = totalWage + totalTips;

  const payoutKey = `${selectedMonth.getFullYear()}-${
    selectedMonth.getMonth() + 1
  }`;
  const paidOut = payoutByMonth.get(payoutKey) ?? 0;
  const difference = paidOut - totalIncome;

  const monthName = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(selectedMonth);

  function previousMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const backup: BackupFile = {
      version: 1,
      createdAt: new Date().toISOString(),
      shifts,
      monthlyPayouts,
    };
    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      JSON.stringify(backup, null, 2),
      `shiftflow-backup-${date}.json`,
      "application/json"
    );
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        if (!userId) {
          throw new Error("Du bist nicht angemeldet.");
        }

        const parsed: unknown = JSON.parse(String(reader.result));

        if (!isBackupFile(parsed)) {
          throw new Error("Diese Datei ist kein gültiges ShiftFlow-Backup.");
        }

        const shiftRows = parsed.shifts.map((shift) => ({
          id: shift.id,
          user_id: userId,
          employer: shift.employer,
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          pause: shift.pause,
          hourly_rate: Number(shift.hourly_rate),
          tips: Number(shift.tips),
          hours: Number(shift.hours),
          wage: Number(shift.wage),
        }));
        const payoutRows = parsed.monthlyPayouts.map((payout) => ({
          user_id: userId,
          year: Number(payout.year),
          month: Number(payout.month),
          amount: Number(payout.amount),
          updated_at: new Date().toISOString(),
        }));

        const supabase = createClient();
        const { error: shiftError } = await supabase
          .from("shifts")
          .upsert(shiftRows, { onConflict: "id" });

        if (shiftError) throw shiftError;

        if (payoutRows.length > 0) {
          const { error: payoutError } = await supabase
            .from("monthly_payouts")
            .upsert(payoutRows, { onConflict: "user_id,year,month" });

          if (payoutError) throw payoutError;
        }

        setShifts(shiftRows);
        setMonthlyPayouts(payoutRows);
        setMessage(
          `${shiftRows.length} Schichten wurden erfolgreich importiert.`
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Das Backup konnte nicht importiert werden."
        );
      } finally {
        input.value = "";
      }
    };

    reader.readAsText(file);
  }

  function escapeCsv(value: string | number | boolean) {
    const text = String(value).replaceAll('"', '""');
    return `"${text}"`;
  }

  function exportCsv() {
    const header = [
      "Datum",
      "Arbeitgeber",
      "Beginn",
      "Ende",
      "Pause",
      "Stunden",
      "Stundenlohn",
      "Grundlohn",
      "Trinkgeld",
      "Gesamt",
    ];

    const rows = monthShifts.map((shift) => [
      shift.date,
      shift.employer,
      shift.start_time.slice(0, 5),
      shift.end_time.slice(0, 5),
      shift.pause ? "Ja" : "Nein",
      Number(shift.hours).toFixed(2).replace(".", ","),
      Number(shift.hourly_rate).toFixed(2),
      Number(shift.wage).toFixed(2),
      Number(shift.tips).toFixed(2),
      (Number(shift.wage) + Number(shift.tips)).toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");
    const monthNumber = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    const filename = `schichten-${selectedMonth.getFullYear()}-${monthNumber}.csv`;

    downloadFile(
      "\uFEFF" + csv,
      filename,
      "text/csv;charset=utf-8"
    );
  }

  if (loading) {
    return (
      <main className="p-10 text-center text-slate-400">
        Exportdaten werden geladen …
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="print:hidden">
        <p className="text-sm text-slate-400">Sicherung und Berichte</p>
        <h1 className="mt-1 text-3xl font-bold">Export</h1>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-slate-800 p-4 text-slate-200 print:hidden">
          {message}
        </p>
      )}

      <section className="mt-8 rounded-3xl bg-slate-900 p-6 print:hidden">
        <h2 className="text-xl font-bold">Backup</h2>
        <p className="mt-2 text-slate-400">
          Sichere deine Supabase-Daten als JSON-Datei oder stelle sie wieder her.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportBackup}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
          >
            JSON-Backup herunterladen
          </button>

          <label className="cursor-pointer rounded-xl bg-slate-800 px-5 py-3 font-semibold">
            Backup importieren
            <input
              type="file"
              accept=".json,application/json"
              onChange={importBackup}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <button
            type="button"
            onClick={previousMonth}
            className="rounded-xl bg-slate-800 px-4 py-2"
            aria-label="Vorheriger Monat"
          >
            ←
          </button>

          <h2 className="text-2xl font-bold capitalize">{monthName}</h2>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-xl bg-slate-800 px-4 py-2"
            aria-label="Nächster Monat"
          >
            →
          </button>
        </div>

        <div className="hidden print:block">
          <h1 className="text-3xl font-bold">Monatsübersicht</h1>
          <h2 className="mt-2 text-2xl capitalize">{monthName}</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Arbeitsstunden" value={`${totalHours.toFixed(2)} h`} />
          <SummaryCard label="Grundlohn" value={`${totalWage.toFixed(2)} €`} />
          <SummaryCard label="Trinkgeld" value={`${totalTips.toFixed(2)} €`} />
          <SummaryCard label="Gesamt" value={`${totalIncome.toFixed(2)} €`} />
          <SummaryCard label="Ausgezahlt" value={`${paidOut.toFixed(2)} €`} />
          <SummaryCard label="Differenz" value={`${difference.toFixed(2)} €`} />
          <SummaryCard label="Schichten" value={String(monthShifts.length)} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
          >
            Für Excel exportieren
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-slate-800 px-5 py-3 font-semibold"
          >
            Als PDF speichern
          </button>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-3">Datum</th>
                <th className="px-3 py-3">Arbeitgeber</th>
                <th className="px-3 py-3">Zeit</th>
                <th className="px-3 py-3">Stunden</th>
                <th className="px-3 py-3">Lohn</th>
                <th className="px-3 py-3">Trinkgeld</th>
                <th className="px-3 py-3">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {monthShifts.map((shift) => (
                <tr key={shift.id} className="border-b border-slate-800">
                  <td className="px-3 py-3">
                    {new Date(`${shift.date}T12:00:00`).toLocaleDateString(
                      "de-DE"
                    )}
                  </td>
                  <td className="px-3 py-3">{shift.employer}</td>
                  <td className="px-3 py-3">
                    {shift.start_time.slice(0, 5)} bis {shift.end_time.slice(0, 5)}
                  </td>
                  <td className="px-3 py-3">
                    {Number(shift.hours).toFixed(2)} h
                  </td>
                  <td className="px-3 py-3">
                    {Number(shift.wage).toFixed(2)} €
                  </td>
                  <td className="px-3 py-3">
                    {Number(shift.tips).toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 font-semibold">
                    {(Number(shift.wage) + Number(shift.tips)).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {monthShifts.length === 0 && (
            <p className="py-10 text-center text-slate-400">
              Für diesen Monat sind keine Schichten vorhanden.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800 p-5 print:border print:border-slate-300 print:bg-white">
      <p className="text-sm text-slate-400 print:text-black">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
