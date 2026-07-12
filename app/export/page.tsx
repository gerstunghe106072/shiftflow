"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Shift = {
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

export default function ExportPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const savedShifts: Shift[] = JSON.parse(
      localStorage.getItem("shifts") || "[]"
    );

    setShifts(savedShifts);
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

  const totalHours = monthShifts.reduce(
    (sum, shift) => sum + shift.hours,
    0
  );

  const totalWage = monthShifts.reduce(
    (sum, shift) => sum + shift.wage,
    0
  );

  const totalTips = monthShifts.reduce(
    (sum, shift) => sum + shift.tips,
    0
  );

  const totalIncome = totalWage + totalTips;

  const payoutKey = `${selectedMonth.getFullYear()}-${
    selectedMonth.getMonth() + 1
  }`;

  const payouts =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("monthly-payouts") || "{}")
      : {};

  const paidOut = Number(payouts[payoutKey] || 0);
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

  function downloadFile(
    content: string,
    filename: string,
    type: string
  ) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const backup = {
      createdAt: new Date().toISOString(),
      shifts: JSON.parse(localStorage.getItem("shifts") || "[]"),
      monthlyPayouts: JSON.parse(
        localStorage.getItem("monthly-payouts") || "{}"
      ),
    };

    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      JSON.stringify(backup, null, 2),
      `shiftflow-backup-${date}.json`,
      "application/json"
    );
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result));

        if (!Array.isArray(backup.shifts)) {
          throw new Error("Ungültige Backup-Datei");
        }

        localStorage.setItem(
          "shifts",
          JSON.stringify(backup.shifts)
        );

        localStorage.setItem(
          "monthly-payouts",
          JSON.stringify(backup.monthlyPayouts || {})
        );

        setShifts(backup.shifts);

        alert("Backup wurde erfolgreich importiert.");
      } catch {
        alert("Diese Datei ist kein gültiges ShiftFlow-Backup.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
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
      shift.start,
      shift.end,
      shift.pause ? "Ja" : "Nein",
      shift.hours.toFixed(2).replace(".", ","),
      shift.hourlyRate.toFixed(2),
      shift.wage.toFixed(2),
      shift.tips.toFixed(2),
      (shift.wage + shift.tips).toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");

    const monthNumber = String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0");

    const filename = `schichten-${selectedMonth.getFullYear()}-${monthNumber}.csv`;

    downloadFile(
      "\uFEFF" + csv,
      filename,
      "text/csv;charset=utf-8"
    );
  }

  function printReport() {
    window.print();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="print:hidden">
        <p className="text-sm text-slate-400">
          Sicherung und Berichte
        </p>

        <h1 className="mt-1 text-3xl font-bold">Export</h1>
      </div>

      <section className="mt-8 rounded-3xl bg-slate-900 p-6 print:hidden">
        <h2 className="text-xl font-bold">Backup</h2>

        <p className="mt-2 text-slate-400">
          Sichere alle Schichten und monatlichen Auszahlungen.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
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
            onClick={previousMonth}
            className="rounded-xl bg-slate-800 px-4 py-2"
          >
            ←
          </button>

          <h2 className="text-2xl font-bold capitalize">
            {monthName}
          </h2>

          <button
            onClick={nextMonth}
            className="rounded-xl bg-slate-800 px-4 py-2"
          >
            →
          </button>
        </div>

        <div className="hidden print:block">
          <h1 className="text-3xl font-bold">
            Monatsübersicht
          </h1>

          <h2 className="mt-2 text-2xl capitalize">
            {monthName}
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Arbeitsstunden"
            value={`${totalHours.toFixed(2)} h`}
          />

          <SummaryCard
            label="Grundlohn"
            value={`${totalWage.toFixed(2)} €`}
          />

          <SummaryCard
            label="Trinkgeld"
            value={`${totalTips.toFixed(2)} €`}
          />

          <SummaryCard
            label="Gesamt"
            value={`${totalIncome.toFixed(2)} €`}
          />

          <SummaryCard
            label="Ausgezahlt"
            value={`${paidOut.toFixed(2)} €`}
          />

          <SummaryCard
            label="Differenz"
            value={`${difference.toFixed(2)} €`}
          />

          <SummaryCard
            label="Schichten"
            value={String(monthShifts.length)}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <button
            onClick={exportCsv}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
          >
            Für Excel exportieren
          </button>

          <button
            onClick={printReport}
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
                <tr
                  key={shift.id}
                  className="border-b border-slate-800"
                >
                  <td className="px-3 py-3">
                    {new Date(
                      `${shift.date}T12:00:00`
                    ).toLocaleDateString("de-DE")}
                  </td>

                  <td className="px-3 py-3">
                    {shift.employer}
                  </td>

                  <td className="px-3 py-3">
                    {shift.start} bis {shift.end}
                  </td>

                  <td className="px-3 py-3">
                    {shift.hours.toFixed(2)} h
                  </td>

                  <td className="px-3 py-3">
                    {shift.wage.toFixed(2)} €
                  </td>

                  <td className="px-3 py-3">
                    {shift.tips.toFixed(2)} €
                  </td>

                  <td className="px-3 py-3 font-semibold">
                    {(shift.wage + shift.tips).toFixed(2)} €
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-800 p-5 print:border print:border-slate-300 print:bg-white">
      <p className="text-sm text-slate-400 print:text-black">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}