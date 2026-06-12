import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const ORDER = ["system", "light", "dark"];

function applyTheme(value) {
  const isDark =
    value === "dark" ||
    (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("nextalk-theme") || "system");

  useEffect(() => {
    localStorage.setItem("nextalk-theme", theme);
    applyTheme(theme);
  }, [theme]);

  const cycle = () => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]);

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light" ? "Light mode" : theme === "dark" ? "Dark mode" : "System theme";

  return (
    <button
      onClick={cycle}
      title={`${label} (click to cycle)`}
      data-testid="theme-toggle-btn"
      className={`h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
