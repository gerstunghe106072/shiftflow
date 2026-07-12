"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      if (register) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage(
          "Konto erstellt. Prüfe deine E-Mails und bestätige deine Adresse."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler bei der Supabase-Verbindung."
     );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 p-7">
        <p className="text-sm text-slate-400">ShiftFlow</p>

        <h1 className="mt-2 text-3xl font-bold">
          {register ? "Konto erstellen" : "Anmelden"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              E-Mail-Adresse
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Passwort
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading
              ? "Bitte warten …"
              : register
                ? "Registrieren"
                : "Anmelden"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-xl bg-slate-800 p-4 text-sm">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setRegister(!register);
            setMessage("");
          }}
          className="mt-6 w-full text-sm text-slate-400 hover:text-white"
        >
          {register
            ? "Schon registriert? Anmelden"
            : "Noch kein Konto? Registrieren"}
        </button>
      </div>
    </main>
  );
}