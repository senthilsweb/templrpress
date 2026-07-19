"use client";

import Image from "next/image";
import { useConfig } from "@/providers/config-provider";
import { useTheme } from "@/providers/theme-provider";

export function Logo() {
  const { branding } = useConfig();
  const { darkMode } = useTheme();
  const appName = branding?.app_name || "TemplrPress";

  const isDark = darkMode;
  const logoSrc = isDark && branding?.logo_dark_url
    ? branding.logo_dark_url
    : branding?.logo_url || "";

  if (logoSrc) {
    return (
      <Image
        src={logoSrc}
        alt={appName}
        width={160}
        height={36}
        className="h-9 w-auto object-contain"
        unoptimized
      />
    );
  }

  return (
    <span className="text-2xl font-semibold text-slate-900 dark:text-white">
      {appName}
    </span>
  );
}
