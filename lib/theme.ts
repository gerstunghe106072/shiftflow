export type ThemeSettings = {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
};

export const defaultTheme: ThemeSettings = {
  backgroundColor: "#020617",
  cardColor: "#0f172a",
  textColor: "#ffffff",
  accentColor: "#38bdf8",
  fontFamily: "Geist",
};

export function loadTheme(): ThemeSettings {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const savedTheme = localStorage.getItem("theme-settings");

  if (!savedTheme) {
    return defaultTheme;
  }

  try {
    return {
      ...defaultTheme,
      ...JSON.parse(savedTheme),
    };
  } catch {
    return defaultTheme;
  }
}

export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;

  root.style.setProperty("--app-background", theme.backgroundColor);
  root.style.setProperty("--app-card", theme.cardColor);
  root.style.setProperty("--app-text", theme.textColor);
  root.style.setProperty("--app-accent", theme.accentColor);
  root.style.setProperty("--app-font", theme.fontFamily);
}

export function saveTheme(theme: ThemeSettings) {
  localStorage.setItem("theme-settings", JSON.stringify(theme));
  applyTheme(theme);

  window.dispatchEvent(new Event("theme-settings-changed"));
}