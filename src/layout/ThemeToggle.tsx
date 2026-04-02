import { useAppDispatch, useAppSelector } from "../app/hooks";
import { toggleTheme } from "../features/theme/themeSlice";
import "./ThemeToggle.css";

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => dispatch(toggleTheme())}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <span className="theme-toggle__track" aria-hidden>
        <span className="theme-toggle__thumb" />
      </span>
      <span className="theme-toggle__icons" aria-hidden>
        <span className="theme-toggle__sun">☀</span>
        <span className="theme-toggle__moon">☾</span>
      </span>
    </button>
  );
}
