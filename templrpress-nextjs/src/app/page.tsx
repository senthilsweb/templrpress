"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Code,
  Copy,
  FileText,
  Globe,
  Layers,
  Rocket,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useConfig } from "@/providers/config-provider";
import type { FeatureCard, ShowcaseItem } from "@/lib/config";

// Allowlisted icons for config-driven feature cards; unknown names fall back
// to FileText (see openspec/changes/ui-refresh-api-landing/design.md).
const FEATURE_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  code: Code,
  "file-text": FileText,
  zap: Zap,
  rocket: Rocket,
  layers: Layers,
  globe: Globe,
  terminal: Terminal,
};

// Icon tints cycle across cards so config-driven grids keep the same rhythm
// as the built-in defaults.
const CARD_TINTS = [
  { bg: "bg-blue-100 dark:bg-blue-500/15", fg: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-amber-100 dark:bg-amber-500/15", fg: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-400" },
];

// Gradient presets for features_style: gradient. Cards cycle through the
// first three when a card doesn't name its own preset.
const CARD_GRADIENTS: Record<string, string> = {
  violet: "from-violet-500 via-purple-500 to-purple-600",
  rose: "from-rose-500 via-pink-500 to-pink-600",
  amber: "from-amber-400 via-orange-400 to-orange-500",
  teal: "from-teal-400 via-emerald-500 to-emerald-600",
  navy: "from-slate-700 via-slate-800 to-slate-900",
};
const GRADIENT_CYCLE = ["violet", "rose", "amber"];

const DEFAULT_FEATURES: FeatureCard[] = [
  {
    icon: "book-open",
    title: "Markdown Docs",
    description:
      "Three-column docs with section sidebar, table of contents, and live heading scroll-tracking.",
    url: "/docs",
  },
  {
    icon: "code",
    title: "API Explorer",
    description:
      "Multi-spec OpenAPI viewer with cURL, JavaScript, and Python code examples plus a Try It button.",
    url: "/rest-api-spec",
  },
  {
    icon: "file-text",
    title: "Custom Pages",
    description:
      "Author landing copy, about, or any markdown page. Frontmatter drives metadata and ordering.",
    url: "/about",
  },
];

function QuickstartStrip({ title, command }: { title: string; command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (http origin) — silently ignore.
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl text-left">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-gray-950 px-4 py-3 shadow-sm dark:border-gray-800">
        <Terminal className="h-4 w-4 flex-shrink-0 text-gray-500" />
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-gray-100">
          {command}
        </code>
        <button
          onClick={copy}
          aria-label="Copy command"
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { branding } = useConfig();
  const heroBadge = branding?.hero_badge ?? "Lightweight CMS";
  const heroHeading = branding?.hero_heading ?? "Publish content";
  const heroHighlight = branding?.hero_heading_highlight ?? "fast";
  const heroSuffix = branding?.hero_heading_suffix ?? "with one binary";
  const heroTagline =
    branding?.hero_tagline ??
    "Markdown-driven landing page, docs, and API reference. No build step. No database. Just config.";
  const heroPrimaryText = branding?.hero_cta_primary_text ?? "Read the docs";
  const heroPrimaryURL = branding?.hero_cta_primary_url ?? "/docs";
  const heroSecondaryText = branding?.hero_cta_secondary_text ?? "View API";
  const heroSecondaryURL = branding?.hero_cta_secondary_url ?? "/rest-api-spec";
  const quickstartTitle = branding?.quickstart_title || "Quickstart";
  const quickstartCommand = branding?.quickstart_command || "";
  const features =
    branding?.features && branding.features.length > 0
      ? branding.features
      : DEFAULT_FEATURES;
  const featuresStyle = branding?.features_style === "gradient" ? "gradient" : "tint";
  const showcase: ShowcaseItem[] = branding?.showcase ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        {/* Soft primary glow + dot grid, faded toward the edges. Pure CSS. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -10%, color-mix(in srgb, var(--tg-primary) 10%, transparent), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--tg-primary) 22%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--tg-primary)]/30 bg-[var(--tg-primary)]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--tg-primary)]">
              <Zap className="h-3 w-3" /> {heroBadge}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              {heroHeading}{" "}
              <span className="text-[var(--tg-primary)]">{heroHighlight}</span>{" "}
              {heroSuffix}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{heroTagline}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={heroPrimaryURL}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--tg-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
              >
                {heroPrimaryText} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={heroSecondaryURL}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {heroSecondaryText}
              </Link>
            </div>
            {quickstartCommand && (
              <QuickstartStrip title={quickstartTitle} command={quickstartCommand} />
            )}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => {
            if (featuresStyle === "gradient") {
              const preset =
                CARD_GRADIENTS[item.gradient ?? ""] ??
                CARD_GRADIENTS[GRADIENT_CYCLE[i % GRADIENT_CYCLE.length]];
              return (
                <Link
                  key={`${item.url}-${item.title}`}
                  href={item.url}
                  className={`group flex flex-col items-start rounded-2xl bg-gradient-to-br p-8 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${preset}`}
                >
                  <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/90">
                    {item.description}
                  </p>
                  {item.cta_text && (
                    <span className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-4 py-2 text-sm font-semibold transition group-hover:bg-black/35">
                      {item.cta_text} <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Link>
              );
            }
            const Icon = FEATURE_ICONS[item.icon] ?? FileText;
            const tint = CARD_TINTS[i % CARD_TINTS.length];
            return (
              <Link
                key={`${item.url}-${item.title}`}
                href={item.url}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--tg-primary)]/40 hover:shadow-md"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tint.bg} ${tint.fg}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-[var(--tg-primary)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Showcase rows — alternating text/visual bands (config-driven) */}
      {showcase.length > 0 && (
        <section className="mx-auto w-full max-w-6xl space-y-24 px-6 py-16">
          {showcase.map((row, i) => (
            <div
              key={`${row.title}-${i}`}
              className={`flex flex-col items-center gap-10 lg:gap-16 ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {row.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {row.body}
                </p>
                {row.cta_text && row.cta_url && (
                  <Link
                    href={row.cta_url}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--tg-primary)] hover:underline"
                  >
                    {row.cta_text} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              {row.image_url && (
                <div className="w-full flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.image_url}
                    alt={row.title}
                    className="w-full rounded-2xl border border-border shadow-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
