"use client";

/**
 * Shared sidebar chrome, styled after the PrivacyShield sidebar:
 * - SidebarBrandHeader: logo mark + product name + subtitle (mark-only when
 *   collapsed to the icon rail)
 * - SidebarVersionFooter: static footer pinned to the sidebar bottom with
 *   the semantic release version (from /api/version) and a GitHub link;
 *   clicking the version opens the About modal.
 */

import { useEffect, useState } from "react";
import { BookMarked, Info } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { GitHubIcon } from "@/components/shared/github-icon";
import { useConfig } from "@/providers/config-provider";

interface VersionInfo {
  version: string;
  go?: string;
  os?: string;
  arch?: string;
}

export function SidebarBrandHeader({
  collapsed = false,
  subtitle = "Documentation",
}: {
  collapsed?: boolean;
  subtitle?: string;
}) {
  const { branding } = useConfig();
  const appName = branding?.app_name || "TemplrPress";

  return (
    <div
      className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
        collapsed ? "justify-center px-0" : "gap-2.5 px-5"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <BookMarked className="h-5 w-5 text-white" />
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-white">
            {appName}
          </span>
          <span className="truncate text-[11px] text-white/60">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export function SidebarVersionFooter({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const { branding } = useConfig();
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    fetch("/api/version")
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo(null));
  }, []);

  const version = info?.version || "dev";

  return (
    <div className="shrink-0 border-t border-white/10 p-2">
      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        title={collapsed ? `About · ${version}` : undefined}
        className={`flex w-full items-center rounded-lg text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white ${
          collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
        }`}
      >
        <Info className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="flex-1 truncate text-left font-mono text-xs">
            {version}
          </span>
        )}
      </button>

      {branding?.github_url && (
        <a
          href={branding.github_url}
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          className={`flex items-center rounded-lg text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
          }`}
        >
          <GitHubIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>GitHub</span>}
        </a>
      )}

      <AboutProductModal
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        info={info}
      />
    </div>
  );
}

function AboutProductModal({
  open,
  onOpenChange,
  info,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: VersionInfo | null;
}) {
  const { branding } = useConfig();
  const appName = branding?.app_name || "TemplrPress";
  const blurb =
    branding?.page_description ||
    "A single-binary markdown publishing platform: landing page, docs, blog, and an OpenAPI explorer served from one small binary. No Node at runtime, no database — one YAML file drives everything.";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--tg-primary)] text-white">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {appName}
              </DialogPrimitive.Title>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--tg-primary)]/10 px-2.5 py-0.5 font-mono text-xs font-medium text-[var(--tg-primary)]">
                  {info?.version || "dev"}
                </span>
                {info?.go && (
                  <span className="text-[11px] text-muted-foreground">
                    {info.go} · {info.os}/{info.arch}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogPrimitive.Description className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {blurb}
          </DialogPrimitive.Description>

          <div className="mt-6 flex items-center justify-between">
            {branding?.github_url ? (
              <a
                href={branding.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tg-primary)] hover:underline"
              >
                <GitHubIcon className="h-4 w-4" /> GitHub
              </a>
            ) : (
              <span />
            )}
            <DialogPrimitive.Close className="rounded-lg bg-[var(--tg-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Close
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
