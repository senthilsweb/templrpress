"use client";

import { Check, Palette, Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { THEME_OPTIONS } from "@/lib/config";

export default function SettingsPage() {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a theme colour and appearance mode. Preferences are saved to your browser&apos;s
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">localStorage</code>
          and persist across visits.
        </p>
      </header>

      {/* Theme color */}
      <section className="mb-10 rounded-xl border border-border bg-background p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5 text-[var(--tg-primary)]" />
          Theme colour
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          The selected swatch becomes <code>var(--tg-primary)</code> across the app.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`group relative flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                  isActive
                    ? "border-[var(--tg-primary)] bg-[var(--tg-primary)]/5 shadow-sm"
                    : "border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/50"
                }`}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg shadow-inner"
                  style={{ backgroundColor: opt.color }}
                >
                  {isActive && <Check className="h-5 w-5 text-white" />}
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="mt-0.5 block font-mono text-[11px] uppercase text-muted-foreground">
                    {opt.color}
                  </span>
                </div>
                {isActive && (
                  <span className="absolute right-3 top-3 flex h-2 w-2">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-background p-6">
        <h2 className="mb-1 text-lg font-semibold">Appearance</h2>
        <p className="mb-6 text-sm text-muted-foreground">Switch between light and dark mode.</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (darkMode) toggleDarkMode();
            }}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-5 transition-all ${
              !darkMode
                ? "border-[var(--tg-primary)] bg-[var(--tg-primary)]/5 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex h-20 w-full items-center justify-center rounded-md border border-gray-200 bg-white">
              <Sun className="h-6 w-6 text-amber-500" />
            </div>
            <span className="text-sm font-medium">Light</span>
            {!darkMode && (
              <span className="text-[10px] font-semibold uppercase text-[var(--tg-primary)]">Active</span>
            )}
          </button>

          <button
            onClick={() => {
              if (!darkMode) toggleDarkMode();
            }}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 p-5 transition-all ${
              darkMode
                ? "border-[var(--tg-primary)] bg-[var(--tg-primary)]/5 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex h-20 w-full items-center justify-center rounded-md border border-slate-700 bg-slate-900">
              <Moon className="h-6 w-6 text-slate-300" />
            </div>
            <span className="text-sm font-medium">Dark</span>
            {darkMode && (
              <span className="text-[10px] font-semibold uppercase text-[var(--tg-primary)]">Active</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
