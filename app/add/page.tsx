"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddShiftPage() {
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSaved(false);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const employer = String(formData.get("employer") || "");
    const date = String(formData.get("date") || "");
    const start = String(formData.get("start") || "");
    const end = String(formData.get("end") || "");
    const pause = formData.get("pause") === "on";
    const hourlyRate = Number(formData.get("hourlyRate"));
    const tips = Number(formData.get("tips")) || 0;

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Schichten über Mitternacht
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    let workedMinutes = endMinutes - startMinutes;

    if (pause) {
      workedMinutes -= 30;
    }

    const hours = Math.max(workedMinutes / 60, 0);
    const wage = hours * hourlyRate;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Du musst angemeldet sein, um eine Schicht zu speichern.");
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("shifts").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        employer,
        date,
        start_time: start,
        end_time: end,
        pause,
        hourly_rate: hourlyRate,
        tips,
        hours,
        wage,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      form.reset();
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Schicht konnte nicht gespeichert werden."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Neue Schicht</h1>

      <p className="mt-2 text-slate-400">
        Trage deine Arbeitszeit und deinen Stundenlohn ein.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-3xl bg-slate-900 p-6"
      >
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Arbeitgeber
          </span>

          <input
            name="employer"
            required
            placeholder="Extrablatt"
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Datum
          </span>

          <input
            name="date"
            type="date"
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
              name="start"
              type="time"
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-slate-300">
              Schluss
            </span>

            <input
              name="end"
              type="time"
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
          <input
            name="pause"
            type="checkbox"
            className="h-5 w-5"
          />

          <span>30 Minuten Pause abziehen</span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Stundenlohn
          </span>

          <input
            name="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="13.90"
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Trinkgeld
          </span>

          <input
            name="tips"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Wird gespeichert …" : "Schicht speichern"}
        </button>

        {saved && (
          <p className="text-center text-green-400">
            Schicht wurde in deinem Konto gespeichert.
          </p>
        )}

        {message && (
          <p className="rounded-xl bg-red-500/10 p-4 text-center text-red-400">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}