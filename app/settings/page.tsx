"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  defaultTheme,
  loadTheme,
  saveTheme,
  ThemeSettings,
} from "@/lib/theme";

const accentColors = [
  { name: "Blau", value: "#38bdf8" },
  { name: "Lila", value: "#a78bfa" },
  { name: "Grün", value: "#34d399" },
  { name: "Rot", value: "#fb7185" },
  { name: "Orange", value: "#fb923c" },
  { name: "Pink", value: "#f472b6" },
];

const fonts = [
  "Geist",
  "Arial",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<ThemeSettings>(defaultTheme);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedTheme = loadTheme();

    setSettings(storedTheme);
    applyTheme(storedTheme);
  }, []);

  function updateSetting(
    key: keyof ThemeSettings,
    value: string
  ) {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(updatedSettings);
    applyTheme(updatedSettings);
  }

  function handleSave() {
    saveTheme(settings);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function useDarkTheme() {
    const darkTheme: ThemeSettings = {
      ...settings,
      backgroundColor: "#020617",
      cardColor: "#0f172a",
      textColor: "#ffffff",
    };

    setSettings(darkTheme);
    applyTheme(darkTheme);
  }

  function useLightTheme() {
    const lightTheme: ThemeSettings = {
      ...settings,
      backgroundColor: "#f1f5f9",
      cardColor: "#ffffff",
      textColor: "#0f172a",
    };

    setSettings(lightTheme);
    applyTheme(lightTheme);
  }

  function resetTheme() {
    setSettings(defaultTheme);
    saveTheme(defaultTheme);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div>
        <p className="text-sm text-slate-400">
          Personalisierung
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Einstellungen
        </h1>
      </div>

      <section className="mt-8 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Erscheinungsbild
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={useDarkTheme}
            className="rounded-2xl border border-slate-700 bg-slate-950 p-5 text-left text-white"
          >
            <span className="text-lg font-semibold">
              Dunkel
            </span>

            <span className="mt-1 block text-sm text-slate-400">
              Dunkler Hintergrund
            </span>
          </button>

          <button
            type="button"
            onClick={useLightTheme}
            className="rounded-2xl border border-slate-300 bg-white p-5 text-left text-slate-950"
          >
            <span className="text-lg font-semibold">
              Hell
            </span>

            <span className="mt-1 block text-sm text-slate-500">
              Heller Hintergrund
            </span>
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Eigene Farben
        </h2>

        <div className="mt-6 space-y-5">
          <ColorSetting
            label="Hintergrundfarbe"
            value={settings.backgroundColor}
            onChange={(value) =>
              updateSetting("backgroundColor", value)
            }
          />

          <ColorSetting
            label="Kartenfarbe"
            value={settings.cardColor}
            onChange={(value) =>
              updateSetting("cardColor", value)
            }
          />

          <ColorSetting
            label="Schriftfarbe"
            value={settings.textColor}
            onChange={(value) =>
              updateSetting("textColor", value)
            }
          />
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Akzentfarbe
        </h2>

        <div className="mt-5 flex flex-wrap gap-4">
          {accentColors.map((color) => {
            const selected =
              settings.accentColor === color.value;

            return (
              <button
                key={color.value}
                type="button"
                onClick={() =>
                  updateSetting(
                    "accentColor",
                    color.value
                  )
                }
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                  selected
                    ? "border-white"
                    : "border-slate-700"
                }`}
              >
                <span
                  className="h-6 w-6 rounded-full"
                  style={{
                    backgroundColor: color.value,
                  }}
                />

                <span>{color.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="flex items-center justify-between gap-5">
            <span>Eigene Akzentfarbe</span>

            <input
              type="color"
              value={settings.accentColor}
              onChange={(event) =>
                updateSetting(
                  "accentColor",
                  event.target.value
                )
              }
              className="h-12 w-20 cursor-pointer rounded-xl border-0 bg-transparent"
            />
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Schriftart
        </h2>

        <select
          value={settings.fontFamily}
          onChange={(event) =>
            updateSetting(
              "fontFamily",
              event.target.value
            )
          }
          className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <div
          className="mt-5 rounded-2xl border border-slate-700 p-5"
          style={{
            fontFamily: settings.fontFamily,
          }}
        >
          <p className="text-lg font-semibold">
            Vorschau deiner Schrift
          </p>

          <p className="mt-2 text-sm opacity-70">
            Deine Schichten, Stunden und Einnahmen
            werden in dieser Schrift angezeigt.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Vorschau
        </h2>

        <div
          className="mt-5 rounded-3xl p-6"
          style={{
            backgroundColor: settings.cardColor,
            color: settings.textColor,
            fontFamily: settings.fontFamily,
            border: `2px solid ${settings.accentColor}`,
          }}
        >
          <p className="text-sm opacity-70">
            Juli 2026
          </p>

          <p className="mt-2 text-3xl font-bold">
            684,20 €
          </p>

          <p className="mt-2">42,50 Arbeitsstunden</p>

          <button
            type="button"
            className="mt-5 rounded-xl px-5 py-3 font-semibold text-white"
            style={{
              backgroundColor: settings.accentColor,
            }}
          >
            Neue Schicht
          </button>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="app-accent rounded-xl px-6 py-3 font-semibold"
        >
          Einstellungen speichern
        </button>

        <button
          type="button"
          onClick={resetTheme}
          className="rounded-xl bg-slate-800 px-6 py-3"
        >
          Zurücksetzen
        </button>
      </div>

      {saved && (
        <p className="mt-4 text-green-400">
          Einstellungen wurden gespeichert.
        </p>
      )}
    </main>
  );
}

function ColorSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-5">
      <div>
        <span className="block font-medium">{label}</span>

        <span className="mt-1 block text-sm text-slate-400">
          {value}
        </span>
      </div>

      <input
        type="color"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-20 cursor-pointer rounded-xl border-0 bg-transparent"
      />
    </label>
  );
}