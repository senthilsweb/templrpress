"use client";

import Link from "next/link";
import { useConfig } from "@/providers/config-provider";

export function Footer() {
  const { branding } = useConfig();
  const appName = branding?.app_name ?? "TemplrPress";
  const year = new Date().getFullYear();
  const creditPrefix = branding?.footer_credit_prefix ?? "Built with";
  const creditLinkText = branding?.footer_credit_link_text ?? "TemplrPress";
  const creditLinkUrl =
    branding?.footer_credit_link_url ?? "https://github.com/senthilsweb/templrpress";
  const isExternal = creditLinkUrl.startsWith("http");

  return (
    <footer className="border-t border-border bg-background">
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
    </footer>
  );
}
