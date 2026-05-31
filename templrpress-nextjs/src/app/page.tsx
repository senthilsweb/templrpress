"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Code, FileText, Zap } from "lucide-react";
import { useConfig } from "@/providers/config-provider";

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

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
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
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/docs",
              label: "Markdown Docs",
              description:
                "Three-column docs with section sidebar, table of contents, and live heading scroll-tracking.",
              icon: BookOpen,
            },
            {
              href: "/rest-api-spec",
              label: "API Explorer",
              description:
                "Multi-spec OpenAPI viewer with cURL, JavaScript, and Python code examples plus a Try It button.",
              icon: Code,
            },
            {
              href: "/about",
              label: "Custom Pages",
              description:
                "Author landing copy, about, or any markdown page. Frontmatter drives metadata and ordering.",
              icon: FileText,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-border bg-background p-6 transition hover:border-[var(--tg-primary)] hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tg-primary)]/10 text-[var(--tg-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-[var(--tg-primary)]">
                  {item.label}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
