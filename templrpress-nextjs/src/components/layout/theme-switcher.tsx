"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme-provider";
import { THEME_OPTIONS, type ThemeName } from "@/lib/config";

export function ThemeSwitcher() {
  const { theme, darkMode, setTheme, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDarkMode}
        className="h-9 w-9 rounded-lg border border-border/40 bg-background/80 backdrop-blur-sm"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-border/40 bg-background/80 backdrop-blur-sm"
            aria-label="Change theme color"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value as ThemeName)}
                className={`h-7 w-7 rounded-md border-2 transition-all hover:scale-110 ${
                  theme === opt.value
                    ? "border-foreground shadow-sm"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: opt.color }}
                title={opt.label}
                aria-label={`${opt.label} theme`}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
