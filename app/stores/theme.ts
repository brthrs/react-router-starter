import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (typeof window !== "undefined"
    ? (localStorage.getItem("theme") as Theme) ?? "system"
    : "system") as Theme,
  setTheme: (theme: Theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));

if (typeof window !== "undefined") {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") {
      applyTheme("system");
    }
  });
}
