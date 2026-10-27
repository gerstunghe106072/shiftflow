import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL fehlt. Prüfe die Datei .env.local."
    );
  }

  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlt. Prüfe die Datei .env.local."
    );
  }

  if (!url.startsWith("https://")) {
    throw new Error(
      "Die Supabase-URL ist ungültig. Sie muss mit https:// beginnen."
    );
  }

  return createBrowserClient(url, key);
}
