"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ShiftsPage() {
  const router = useRouter();

  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadShifts() {
      setLoading(true);
      setMessage("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setLoading(false);
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (!active) return;

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setShifts(data ?? []);
      setLoading(false);
    }

    void loadShifts();

    return () => {
      active = false;
    };
  }, [router]);

  async function deleteShift(id: string) {
    if (!userId) {
      setMessage("Du musst angemeldet sein, um eine Schicht zu löschen.");
      return;
    }

    const confirmed = window.confirm(
      "Möchtest du diese Schicht wirklich löschen?"
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setShifts((currentShifts) =>
      currentShifts.filter((shift) => shift.id !== id)
    );
  }

  if (loading) {
    return (
      <main className="p-10 text-center text-slate-400">
        Schichten werden geladen …
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Schichten</h1>

        <Link
          href="/add"
          className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950"
        >
          Neue Schicht
        </Link>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-400">
          {message}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="rounded-2xl bg-slate-900 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {shift.employer}
                </h2>

                <p className="text-slate-400">
                  {new Date(
                    `${shift.date}T12:00:00`
                  ).toLocaleDateString("de-DE")}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  {Number(shift.wage).toFixed(2)} €
                </p>

                <p className="text-slate-400">
                  {Number(shift.hours).toFixed(2)} h
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-slate-300">
              <span>
                {shift.start_time.slice(0, 5)} bis{" "}
                {shift.end_time.slice(0, 5)}
              </span>

              {shift.pause && <span>30 Min. Pause</span>}

              <span>
                {Number(shift.hourly_rate).toFixed(2)} €/h
              </span>

              <span>
                {Number(shift.tips).toFixed(2)} € Trinkgeld
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <Link
                href={`/edit/${shift.id}`}
                className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
              >
                Bearbeiten
              </Link>

              <button
                onClick={() => deleteShift(shift.id)}
                className="rounded-xl bg-red-500/10 px-4 py-2 text-red-400 hover:bg-red-500/20"
              >
                Löschen
              </button>
            </div>
          </div>
        ))}

        {shifts.length === 0 && (
          <div className="rounded-2xl bg-slate-900 p-8 text-center text-slate-400">
            Noch keine Schichten vorhanden.
          </div>
        )}
      </div>
    </main>
  );
}
