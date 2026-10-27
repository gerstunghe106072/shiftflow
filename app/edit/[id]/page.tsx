"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ShiftRow = {
  id: string;
  employer: string;
  date: string;
  start_time: string;
  end_time: string;
  pause: boolean;
  hourly_rate: number;
  tips: number;
  hours: number;
  wage: number;
};

export default function EditShiftPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [employer, setEmployer] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pause, setPause] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
  const [tips, setTips] = useState("0");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadShift() {
      setLoading(true);
      setMessage("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          setMessage(error?.message ?? "Schicht wurde nicht gefunden.");
          setLoading(false);
          return;
        }

        const shift = data as ShiftRow;

        setEmployer(shift.employer);
        setDate(shift.date);
        setStart(shift.start_time.slice(0, 5));
        setEnd(shift.end_time.slice(0, 5));
        setPause(shift.pause);
        setHourlyRate(String(shift.hourly_rate));
        setTips(String(shift.tips));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Die Schicht konnte nicht geladen werden."
        );
      } finally {
        setLoading(false);
      }
    }

    loadShift();
  }, [id, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    if (!userId) {
      setMessage("Du musst angemeldet sein, um eine Schicht zu bearbeiten.");
      setSaving(false);
      router.push("/login");
      return;
    }

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    let workedMinutes = endMinutes - startMinutes;

    if (pause) {
      workedMinutes -= 30;
    }

    const hours = Math.max(workedMinutes / 60, 0);
    const rate = Number(hourlyRate);
    const tipAmount = Number(tips) || 0;
    const wage = hours * rate;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("shifts")
        .update({
          employer,
          date,
          start_time: start,
          end_time: end,
          pause,
          hourly_rate: rate,
          tips: tipAmount,
          hours,
          wage,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/shifts");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Änderungen konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-10 text-center text-slate-400">
        Schicht wird geladen …
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Schicht bearbeiten</h1>

      {message && (
        <p className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-400">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-3xl bg-slate-900 p-6"
      >
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Arbeitgeber
          </span>

          <input
            value={employer}
            onChange={(event) => setEmployer(event.target.value)}
            required
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Datum
          </span>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="mb-2 block text-sm text-slate-300">
              Beginn
            </span>

            <input
              type="time"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">
              Schluss
            </span>

            <input
              type="time"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
          <input
            type="checkbox"
            checked={pause}
            onChange={(event) => setPause(event.target.checked)}
            className="h-5 w-5"
          />

          <span>30 Minuten Pause abziehen</span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Stundenlohn
          </span>

          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
            required
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Trinkgeld
          </span>

          <input
            type="number"
            step="0.01"
            min="0"
            value={tips}
            onChange={(event) => setTips(event.target.value)}
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Wird gespeichert …" : "Änderungen speichern"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/shifts")}
            className="rounded-xl bg-slate-800 px-5 py-3"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </main>
  );
}
