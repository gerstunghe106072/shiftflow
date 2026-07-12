"use client";

import { useEffect } from "react";
import { applyTheme, loadTheme } from "@/lib/theme";

export default function ThemeController() {
  useEffect(() => {
    function updateTheme() {
      applyTheme(loadTheme());
    }

    updateTheme();

    window.addEventListener("theme-settings-changed", updateTheme);

    return () => {
      window.removeEventListener("theme-settings-changed", updateTheme);
    };
  }, []);

  return null;
}