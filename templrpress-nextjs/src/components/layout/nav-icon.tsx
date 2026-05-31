"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import * as LucideIcons from "lucide-react";

export function NavIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string;
  className?: string;
}) {
  if (!icon) return null;

  if (icon.includes(":")) {
    return <IconifyIcon icon={icon} className={className} />;
  }

  const pascalName = icon
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideComponent = (LucideIcons as any)[pascalName] as React.ComponentType<{ className?: string }> | undefined;

  if (LucideComponent) {
    return <LucideComponent className={className} />;
  }

  return null;
}
