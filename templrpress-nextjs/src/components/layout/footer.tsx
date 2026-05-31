"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useConfig } from "@/providers/config-provider";

export function Footer() {
  const { branding } = useConfig();
  const appName = branding?.app_name ?? "TemplrPress";
  const year = new Date().getFullYear();

  const tagline = branding?.footer_tagline ?? "";
  const columns = branding?.footer_columns ?? [];
  const ctaTagline = branding?.footer_cta_tagline ?? "";
  const ctaPrimary = branding?.footer_cta_primary ?? "";
  const ctaSecondary = branding?.footer_cta_secondary ?? "";
  const ctaButtonText = branding?.footer_cta_button_text ?? "";
  const ctaButtonURL = branding?.footer_cta_button_url ?? "/docs";

  const creditPrefix = branding?.footer_credit_prefix ?? "Built with";
  const creditLinkText = branding?.footer_credit_link_text ?? "TemplrPress";
  const creditLinkUrl =
    branding?.footer_credit_link_url ?? "https://github.com/senthilsweb/templrpress";
  const isExternal = creditLinkUrl.startsWith("http");

  const showCTA = Boolean(ctaTagline || ctaPrimary || ctaButtonText);
  const showColumns = columns.length > 0;

  return (
    <footer
      className="relative border-t border-border bg-gradient-to-b from-muted/40 via-muted/10 to-background"
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--tg-primary) 8%, transparent) 0%, transparent 60%), linear-gradient(to bottom, color-mix(in srgb, var(--muted) 60%, transparent), transparent 70%)",
      }}
    >
      {showCTA && (
        <div>
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
            <div>
              {ctaTagline && (
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-primary)]">
                  {ctaTagline}
                </p>
              )}
              {(ctaPrimary || ctaSecondary) && (
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {ctaPrimary}
                  {ctaPrimary && ctaSecondary && " "}
                  {ctaSecondary && (
                    <span className="text-muted-foreground">{ctaSecondary}</span>
                  )}
                </h2>
              )}
            </div>
            {ctaButtonText && (
              <Link
                href={ctaButtonURL}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--tg-primary)] px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:opacity-90"
              >
                {ctaButtonText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {(showColumns || tagline) && (
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-base font-semibold text-foreground">{appName}</p>
            {tagline && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {tagline}
              </p>
            )}
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <Link
                      href={l.url}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      className="text-muted-foreground transition-colors hover:text-[var(--tg-primary)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {year} {appName}. All rights reserved.
          </p>
          <p>
            {creditPrefix}{" "}
            <Link
              href={creditLinkUrl}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="font-medium text-foreground transition-colors hover:text-[var(--tg-primary)]"
            >
              {creditLinkText}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
