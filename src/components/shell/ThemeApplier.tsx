"use client";

import { useEffect } from "react";
import { useSettings } from "@/db/hooks";

export function ThemeApplier() {
  const { theme } = useSettings();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.classList.remove("theme-light", "theme-dark", "theme-system");
    html.classList.add(`theme-${theme}`);
  }, [theme]);

  return null;
}
