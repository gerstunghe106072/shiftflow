"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Benutzer");
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const userEmail = user.email ?? "";

      setEmail(userEmail);

      const metadataName =
        user.user_metadata?.display_name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name;

      if (metadataName) {
        setDisplayName(String(metadataName));
        return;
      }

      if (userEmail) {
        const emailName = userEmail.split("@")[0];

        setDisplayName(
          emailName.charAt(0).toUpperCase() + emailName.slice(1)
        );
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Fehler beim Abmelden:", error);
      alert(`Abmelden fehlgeschlagen: ${error.message}`);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (!email) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2 text-left hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
          {displayName.charAt(0).toUpperCase()}
        </span>

        <span className="hidden sm:block">
          <span className="block text-sm font-semibold text-white">
            {displayName}
          </span>

          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Online
          </span>
        </span>

        <span className="text-slate-400">⌄</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          <div className="border-b border-slate-800 px-4 py-4">
            <p className="font-semibold text-white">
              {displayName}
            </p>

            <p className="mt-1 truncate text-sm text-slate-400">
              {email}
            </p>
          </div>

          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Einstellungen
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 block w-full rounded-xl px-3 py-3 text-left text-sm text-red-300 hover:bg-slate-800 disabled:opacity-60"
            >
              {loggingOut ? "Wird abgemeldet …" : "Abmelden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}