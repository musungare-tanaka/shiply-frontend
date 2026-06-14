import { Moon, SunMedium } from "lucide-react";

export type DashboardTheme = "light" | "dark";

interface ThemeToggleProps {
  theme: DashboardTheme;
  onToggle: () => void;
  compact?: boolean;
}

const ThemeToggle = ({ theme, onToggle, compact = false }: ThemeToggleProps) => {
  const isDark = theme === "dark";
  const label = compact
    ? isDark
      ? "Dark"
      : "Light"
    : isDark
      ? "Dark mode"
      : "Light mode";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`app-theme-toggle ${compact ? "app-theme-toggle-compact" : ""}`}
    >
      <span className="app-theme-toggle__icon" aria-hidden="true">
        {isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      </span>
      <span className="app-theme-toggle__text">
        {label}
      </span>
    </button>
  );
};

export default ThemeToggle;
