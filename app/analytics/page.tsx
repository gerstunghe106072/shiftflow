"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type MonthlyData = {
  month: string;
  hours: number;
  wage: number;
  tips: number;
  income: number;
};

export default function AnalyticsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [paidOut, setPaidOut] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [payoutMessage, setPayoutMessage] = useState("");

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
        setShifts([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

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

  useEffect(() => {
    async function loadPayout() {
      if (!userId) {
        return;
      }

      setPayoutLoading(true);
      setPayoutMessage("");

      const supabase = createClient();

      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      const { data, error } = await supabase
        .from("monthly_payouts")
        .select("amount")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (error) {
        console.error("Fehler beim Laden der Auszahlung:", error);

        setPayoutMessage(
          `Die Auszahlung konnte nicht geladen werden: ${error.message}`
        );

        setPaidOut("");
      } else {
        setPaidOut(
          data?.amount === null || data?.amount === undefined
            ? ""
            : String(data.amount)
        );
      }

      setPayoutLoading(false);
    }

    loadPayout();
  }, [selectedMonth, userId]);

  const monthShifts = useMemo(() => {
    return shifts
      .filter((shift) => {
        const shiftDate = new Date(`${shift.date}T12:00:00`);

        return (
          shiftDate.getMonth() === selectedMonth.getMonth() &&
          shiftDate.getFullYear() === selectedMonth.getFullYear()
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, selectedMonth]);

  const monthlyChartData = useMemo<MonthlyData[]>(() => {
    const year = selectedMonth.getFullYear();

    return Array.from({ length: 12 }, (_, monthIndex) => {
      const shiftsInMonth = shifts.filter((shift) => {
        const shiftDate = new Date(`${shift.date}T12:00:00`);

        return (
          shiftDate.getFullYear() === year &&
          shiftDate.getMonth() === monthIndex
        );
      });

      const hours = shiftsInMonth.reduce(
        (sum, shift) => sum + Number(shift.hours ?? 0),
        0
      );

      const wage = shiftsInMonth.reduce(
        (sum, shift) => sum + Number(shift.wage ?? 0),
        0
      );

      const tips = shiftsInMonth.reduce(
        (sum, shift) => sum + Number(shift.tips ?? 0),
        0
      );

      return {
        month: new Intl.DateTimeFormat("de-DE", {
          month: "short",
        }).format(new Date(year, monthIndex, 1)),
        hours: Number(hours.toFixed(2)),
        wage: Number(wage.toFixed(2)),
        tips: Number(tips.toFixed(2)),
        income: Number((wage + tips).toFixed(2)),
      };
    });
  }, [shifts, selectedMonth]);

  const totalHours = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.hours ?? 0),
    0
  );

  const totalWage = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.wage ?? 0),
    0
  );

  const totalTips = monthShifts.reduce(
    (sum, shift) => sum + Number(shift.tips ?? 0),
    0
  );

  const totalIncome = totalWage + totalTips;

  const averageHourlyRate =
    totalHours > 0 ? totalIncome / totalHours : 0;

  const paidOutNumber = Number(paidOut) || 0;
  const payoutDifference = paidOutNumber - totalIncome;

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

  function goToCurrentMonth() {
    setSelectedMonth(new Date());
  }

  async function savePayout() {
    if (!userId) {
      setPayoutMessage("Du bist nicht angemeldet.");
      return;
    }

    const amount = Number(paidOut);

    if (paidOut.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setPayoutMessage("Bitte gib einen gültigen Auszahlungsbetrag ein.");
      return;
    }

    setSavingPayout(true);
    setPayoutMessage("");

    const supabase = createClient();

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    const { error } = await supabase
      .from("monthly_payouts")
      .upsert(
        {
          user_id: userId,
          year,
          month,
          amount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,year,month",
        }
      );

    if (error) {
      console.error("Fehler beim Speichern der Auszahlung:", error);

      setPayoutMessage(
        `Die Auszahlung konnte nicht gespeichert werden: ${error.message}`
      );
    } else {
      setPayoutMessage("Auszahlung wurde online gespeichert.");
    }

    setSavingPayout(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Analytics wird geladen …</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={previousMonth}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-xl hover:bg-slate-800"
          aria-label="Vorheriger Monat"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-400">Monatsübersicht</p>

          <h1 className="mt-1 text-3xl font-bold capitalize">
            {monthName}
          </h1>
        </div>

        <button
          onClick={nextMonth}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-xl hover:bg-slate-800"
          aria-label="Nächster Monat"
        >
          →
        </button>
      </div>

      <div className="mt-5 text-center">
        <button
          onClick={goToCurrentMonth}
          className="text-sm text-slate-400 hover:text-white"
        >
          Zum aktuellen Monat
        </button>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {errorMessage}
        </div>
      )}

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gesamteinnahmen"
          value={`${totalIncome.toFixed(2)} €`}
        />

        <StatCard
          label="Arbeitsstunden"
          value={`${totalHours.toFixed(2)} h`}
        />

        <StatCard
          label="Grundlohn"
          value={`${totalWage.toFixed(2)} €`}
        />

        <StatCard
          label="Trinkgeld"
          value={`${totalTips.toFixed(2)} €`}
        />
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2">
        <StatCard
          label="Anzahl Schichten"
          value={String(monthShifts.length)}
        />

        <StatCard
          label="Effektiver Stundenlohn"
          value={`${averageHourlyRate.toFixed(2)} €/h`}
        />
      </section>

      <section className="mt-10 rounded-3xl bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Jahresübersicht {selectedMonth.getFullYear()}
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Einnahmen pro Monat
        </h2>

        <div className="mt-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#334155"
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} €`}
              />

              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                }}
                formatter={(value) => [
                  `${Number(value).toFixed(2)} €`,
                  "Einnahmen",
                ]}
              />

              <Bar
                dataKey="income"
                fill="#f8fafc"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-slate-900 p-6">
        <p className="text-sm text-slate-400">Arbeitszeit im Jahr</p>

        <h2 className="mt-1 text-2xl font-bold">
          Stunden pro Monat
        </h2>

        <div className="mt-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#334155"
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} h`}
              />

              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                }}
                formatter={(value) => [
                  `${Number(value).toFixed(2)} h`,
                  "Stunden",
                ]}
              />

              <Bar
                dataKey="hours"
                fill="#94a3b8"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Auszahlung</h2>

        <div className="mt-5">
          <label
            htmlFor="paid-out"
            className="text-slate-400"
          >
            Tatsächlich ausgezahlt
          </label>

          <input
            id="paid-out"
            type="number"
            min="0"
            step="0.01"
            value={paidOut}
            disabled={payoutLoading || savingPayout}
            onChange={(event) => setPaidOut(event.target.value)}
            className="mt-2 w-full rounded-xl bg-slate-800 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={savePayout}
          disabled={payoutLoading || savingPayout}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingPayout
            ? "Wird gespeichert …"
            : payoutLoading
              ? "Wird geladen …"
              : "Auszahlung speichern"}
        </button>

        {payoutMessage && (
          <p className="mt-4 text-sm text-slate-300">
            {payoutMessage}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-slate-400">Berechnet</p>
            <p className="text-2xl font-bold">
              {totalIncome.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-slate-400">Ausgezahlt</p>
            <p className="text-2xl font-bold">
              {paidOutNumber.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-slate-400">Differenz</p>

            <p
              className={`text-2xl font-bold ${
                payoutDifference >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {payoutDifference.toFixed(2)} €
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Schichten im Monat</h2>

        <div className="mt-5 space-y-4">
          {monthShifts.map((shift) => (
            <div
              key={shift.id}
              className="rounded-2xl bg-slate-900 p-5"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h3 className="text-lg font-semibold">
                    {shift.employer}
                  </h3>

                  <p className="mt-1 text-slate-400">
                    {new Date(
                      `${shift.date}T12:00:00`
                    ).toLocaleDateString("de-DE")}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {shift.start_time} bis {shift.end_time}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">
                    {(
                      Number(shift.wage ?? 0) +
                      Number(shift.tips ?? 0)
                    ).toFixed(2)}{" "}
                    €
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {Number(shift.hours ?? 0).toFixed(2)} h
                  </p>
                </div>
              </div>
            </div>
          ))}

          {monthShifts.length === 0 && (
            <div className="rounded-3xl bg-slate-900 p-10 text-center text-slate-400">
              Für diesen Monat sind noch keine Schichten eingetragen.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}