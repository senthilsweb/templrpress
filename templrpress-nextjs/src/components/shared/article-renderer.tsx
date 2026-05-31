"use client";

import Link from "next/link";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function extractCodeText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractCodeText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractCodeText(
      (node as React.ReactElement<{ children?: React.ReactNode }>).props
        .children,
    );
  }
  return "";
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^(#{2,4})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/[*_`~]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      entries.push({ id, text, level: m[1].length });
    }
  }
  return entries;
}

function headingId(children: React.ReactNode): string {
  return extractCodeText(children)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function isExternalHref(href: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

function normalizeDocsHref(href: string): string {
  if (!href || href.startsWith("#") || href.startsWith("/") || isExternalHref(href)) {
    return href;
  }

  const [rawPath, rawHash] = href.split("#", 2);
  if (!rawPath) {
    return rawHash ? `#${rawHash}` : href;
  }

  const basename = rawPath.replace(/\\/g, "/").split("/").filter(Boolean).pop();
  if (!basename) {
    return href;
  }

  const slug = basename.replace(/\.md$/i, "");
  return rawHash
    ? `/docs?slug=${encodeURIComponent(slug)}#${rawHash}`
    : `/docs?slug=${encodeURIComponent(slug)}`;
}

/* ------------------------------------------------------------------ */
/*  Code Copy Button                                                   */
/* ------------------------------------------------------------------ */

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
    >
      {copied ? (
        <Check className="size-3 text-green-500" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Syntax colorizer                                                   */
/* ------------------------------------------------------------------ */

function detectLanguage(className?: string): string {
  const m = className?.match(/language-([\w-]+)/);
  return m ? m[1] : "text";
}

const LANG_LABELS: Record<string, string> = {
  bash: "BASH",
  sh: "SHELL",
  shell: "SHELL",
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  javascript: "JS",
  js: "JS",
  typescript: "TS",
  ts: "TS",
  go: "GO",
  python: "PYTHON",
  py: "PYTHON",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  text: "CODE",
  toml: "TOML",
  ini: "INI",
  dockerfile: "DOCKER",
  lua: "LUA",
  powershell: "POWERSHELL",
  ps1: "POWERSHELL",
};

function colorizeCode(code: string, language: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const tokens: React.ReactNode[] = [];
    let key = 0;
    const push = (text: string, color: string) => {
      if (text) {
        tokens.push(
          <span key={key++} className={color}>
            {text}
          </span>,
        );
      }
    };

    /** Consume text left-to-right, applying the first matching pattern at each position */
    const tokenize = (text: string, patterns: [RegExp, string][]) => {
      while (text.length > 0) {
        let matched = false;
        for (const [re, color] of patterns) {
          const m = text.match(re);
          if (m) {
            push(m[0], color);
            text = text.slice(m[0].length);
            matched = true;
            break;
          }
        }
        if (!matched) {
          push(text[0], "text-slate-300");
          text = text.slice(1);
        }
      }
    };

    if (language === "bash" || language === "sh" || language === "shell") {
      if (line.trimStart().startsWith("#")) {
        push(line, "text-gray-500");
      } else {
        let rest = line;
        const cmdMatch = rest.match(/^(\s*)([\w][\w./-]*)/);
        if (cmdMatch) {
          if (cmdMatch[1]) push(cmdMatch[1], "");
          push(cmdMatch[2], "text-emerald-400");
          rest = rest.slice(cmdMatch[0].length);
        }
        tokenize(rest, [
          [/^\s+/, ""],
          [/^--?[\w-]+/, "text-purple-400"],
          [/^(['"])((?:(?!\1)[^\\]|\\.)*)\1/, "text-amber-300"],
          [/^\$\{?[\w]+\}?/, "text-sky-300"],
          [/^[|>&;\\]+/, "text-gray-400"],
          [/^[^\s'"$|>&;\\]+/, "text-slate-300"],
        ]);
      }
    } else if (language === "yaml" || language === "yml") {
      if (line.trimStart().startsWith("#")) {
        push(line, "text-gray-500");
      } else {
        let rest = line;
        const wsMatch = rest.match(/^(\s+)/);
        if (wsMatch) {
          push(wsMatch[1], "");
          rest = rest.slice(wsMatch[1].length);
        }
        const keyMatch = rest.match(/^([\w][\w.-]*)(:)/);
        if (keyMatch) {
          push(keyMatch[1], "text-sky-300");
          push(keyMatch[2], "text-gray-400");
          rest = rest.slice(keyMatch[0].length);
        }
        if (rest.startsWith("- ")) {
          push("- ", "text-gray-400");
          rest = rest.slice(2);
          const nk = rest.match(/^([\w][\w.-]*)(:)/);
          if (nk) {
            push(nk[1], "text-sky-300");
            push(nk[2], "text-gray-400");
            rest = rest.slice(nk[0].length);
          }
        }
        tokenize(rest, [
          [/^\s+/, ""],
          [/^#.*/, "text-gray-500"],
          [/^(['"])((?:(?!\1)[^\\]|\\.)*)\1/, "text-amber-300"],
          [/^(true|false|null)\b/, "text-amber-400"],
          [/^\d+\.?\d*/, "text-purple-400"],
          [/^[^\s'"#]+/, "text-slate-300"],
        ]);
      }
    } else if (language === "json") {
      tokenize(line, [
        [/^\s+/, ""],
        [/^"[^"]*"(?=\s*:)/, "text-sky-300"],
        [/^:/, "text-gray-400"],
        [/^"[^"]*"/, "text-amber-300"],
        [/^(true|false|null)\b/, "text-amber-400"],
        [/^\d+\.?\d*/, "text-purple-400"],
        [/^[{}\[\],]+/, "text-gray-400"],
        [/^[^\s"{}[\],]+/, "text-slate-300"],
      ]);
    } else if (language === "go") {
      if (line.trimStart().startsWith("//")) {
        push(line, "text-gray-500");
      } else {
        tokenize(line, [
          [/^\s+/, ""],
          [/^(package|import|func|var|const|type|struct|interface|return|if|else|for|range|switch|case|defer|go|chan)\b/, "text-purple-400"],
          [/^(nil|true|false)\b/, "text-amber-400"],
          [/^err\b/, "text-red-400"],
          [/^"[^"]*"/, "text-amber-300"],
          [/^`[^`]*`/, "text-amber-300"],
          [/^'[^']*'/, "text-amber-300"],
          [/^\d+\.?\d*/, "text-purple-400"],
          [/^\/\/.*/, "text-gray-500"],
          [/^[^\s"'`\d]+/, "text-slate-300"],
        ]);
      }
    } else {
      push(line, "text-slate-300");
    }

    return <div key={i}>{tokens.length > 0 ? tokens : "\n"}</div>;
  });
}

/* ------------------------------------------------------------------ */
/*  Table of Contents (right-side)                                     */
/* ------------------------------------------------------------------ */

export function TableOfContents({
  toc,
  activeId,
}: {
  toc: TocEntry[];
  activeId: string;
}) {
  if (toc.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        On this page
      </h3>
      {toc.map((entry) => {
        const isActive = activeId === entry.id;
        const indent =
          entry.level === 3 ? "pl-3" : entry.level === 4 ? "pl-6" : "";
        return (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(entry.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block text-[13px] leading-relaxed transition-colors ${indent} ${
              isActive
                ? "font-semibold text-[var(--tg-primary)] border-l-2 border-[var(--tg-primary)] pl-2"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {entry.text}
          </a>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  useActiveHeading — scroll-tracking hook                            */
/* ------------------------------------------------------------------ */

export function useActiveHeading(toc: TocEntry[]): string {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (toc.length === 0) return;

    const timer = setTimeout(() => {
      const headingElements = toc
        .map((entry) => document.getElementById(entry.id))
        .filter(Boolean) as HTMLElement[];

      if (headingElements.length === 0) return;

      // Walk up from the first heading to find the nearest scrollable
      // ancestor. The docs layout scrolls the article in an internal
      // `overflow-y-auto` div, not the window, so listening on `window`
      // never fires and the TOC gets stuck on whatever pickActive()
      // picked on mount (usually the last entry, because all rects were
      // already above the threshold by the time the effect ran).
      const findScrollParent = (el: HTMLElement): HTMLElement | Window => {
        let node: HTMLElement | null = el.parentElement;
        while (node) {
          const style = window.getComputedStyle(node);
          const oy = style.overflowY;
          if (
            (oy === "auto" || oy === "scroll" || oy === "overlay") &&
            node.scrollHeight > node.clientHeight
          ) {
            return node;
          }
          node = node.parentElement;
        }
        return window;
      };

      const scroller = findScrollParent(headingElements[0]);

      const pickActive = () => {
        // Anchor line: ~120 px below the top of either the viewport or
        // the scroll container, whichever we're tracking. The active
        // heading is the last one whose top is at or above that line.
        const anchor =
          scroller === window
            ? 120
            : (scroller as HTMLElement).getBoundingClientRect().top + 120;

        let current = headingElements[0]?.id ?? "";
        for (const el of headingElements) {
          const top = el.getBoundingClientRect().top;
          if (top - anchor <= 0) {
            current = el.id;
          } else {
            break;
          }
        }
        setActiveId((prev) => (prev === current ? prev : current));
      };

      pickActive();

      const onScroll = () => pickActive();
      // Attach to whichever element actually scrolls. Works for window
      // scrolls (blog/about layouts) and for the inner div in /docs.
      (scroller as HTMLElement | Window).addEventListener("scroll", onScroll, {
        passive: true,
      } as AddEventListenerOptions);
      window.addEventListener("resize", onScroll, { passive: true });

      return () => {
        (scroller as HTMLElement | Window).removeEventListener(
          "scroll",
          onScroll,
        );
        window.removeEventListener("resize", onScroll);
      };
    }, 150);

    return () => clearTimeout(timer);
  }, [toc]);

  return activeId;
}


/* ------------------------------------------------------------------ */
/*  ArticleBody — the shared markdown renderer                         */
/* ------------------------------------------------------------------ */

export function ArticleBody({
  content,
  linkMode = "default",
}: {
  content: string;
  linkMode?: "default" | "docs";
}) {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-headings:scroll-mt-20 prose-a:text-[var(--tg-primary)] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[var(--tg-primary)] prose-blockquote:bg-[var(--tg-primary)]/5 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:italic prose-code:before:content-[''] prose-code:after:content-[''] prose-code:rounded prose-code:border prose-code:border-gray-200 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal dark:prose-code:border-gray-700 dark:prose-code:bg-gray-800 prose-pre:bg-[#1e1e2e] prose-pre:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 id={headingId(children)} className="scroll-mt-20">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={headingId(children)} className="scroll-mt-20">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 id={headingId(children)} className="scroll-mt-20">
              {children}
            </h4>
          ),
          a: ({ href = "", children }) => {
            const normalizedHref = linkMode === "docs" ? normalizeDocsHref(href) : href;

            if (!normalizedHref || normalizedHref.startsWith("#") || isExternalHref(normalizedHref)) {
              return (
                <a
                  href={normalizedHref}
                  {...(isExternalHref(normalizedHref)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {children}
                </a>
              );
            }

            return <Link href={normalizedHref}>{children}</Link>;
          },
          pre: ({ children }) => {
            const text = extractCodeText(children);
            let lang = "text";
            if (
              children &&
              typeof children === "object" &&
              "props" in (children as React.ReactElement)
            ) {
              const codeProps = (
                children as React.ReactElement<{ className?: string }>
              ).props;
              lang = detectLanguage(codeProps.className);
            }

            const label = LANG_LABELS[lang] ?? lang.toUpperCase();
            return (
              <div className="not-prose my-4 overflow-hidden rounded-2xl bg-zinc-900 shadow-md">
                <div className="flex items-center border-b border-zinc-700 bg-zinc-800 px-4 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {label}
                  </span>
                  <div className="ml-auto">
                    <CodeCopyButton text={text} />
                  </div>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed !bg-transparent !m-0">
                  <code>{colorizeCode(text, lang)}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
