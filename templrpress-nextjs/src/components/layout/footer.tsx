"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useConfig } from "@/providers/config-provider";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  const { branding } = useConfig();
  const appName = branding?.app_name ?? "TemplrGo";
  const year = new Date().getFullYear();
  const creditPrefix = branding?.footer_credit_prefix ?? "Built with ♥ by";
  const creditLinkText = branding?.footer_credit_link_text ?? "senthilsweb";
  const creditLinkUrl = branding?.footer_credit_link_url ?? "https://github.com/senthilsweb";

  return (
    <footer className="bg-black text-white">
      {/* CTA band */}
      <div className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-sm font-medium text-white/50">
            {branding?.footer_cta_tagline ?? "Ready to get started?"}
          </p>
          <h2 className="mb-8 text-4xl font-black uppercase leading-tight tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-pink-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              {branding?.footer_cta_primary ?? "Launch your toolkit"}
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
              {branding?.footer_cta_secondary ?? "in seconds."}
            </span>
          </h2>
          <Link
            href={branding?.footer_cta_button_url ?? "/docs"}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {branding?.footer_cta_button_text ?? "Get started"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="shrink-0 opacity-80 hover:opacity-100 transition-opacity">
            <Logo />
          </Link>
          <p className="text-sm text-white/40">
            {year} {appName}. All rights reserved. · {creditPrefix}{" "}
            <a
              href={creditLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/80 transition-colors"
            >
              {creditLinkText}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
