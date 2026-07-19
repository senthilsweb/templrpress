"use client";

/**
 * Mintlify-style docs search: a navbar pill (with ⌘K shortcut) that opens a
 * right-side drawer scoped to the docs. Matches titles and descriptions from
 * /api/cms/docs/nav client-side; full-text content search is not implemented
 * yet. AI assistant is intentionally absent — the external chatbot
 * microfrontend decorates the page on its own.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface DocEntry {
  title: string;
  navTitle?: string;
  slug: string;
  description: string;
  folder: string;
}

interface NavPayload {
  sections: { label: string; items: DocEntry[] }[];
  rootItems: DocEntry[];
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DocEntry[] | null>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K opens, Escape closes (Escape handled by the Sheet itself).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load the docs index once, on first open.
  useEffect(() => {
    if (!open || entries !== null) return;
    fetch("/api/cms/docs/nav")
      .then((r) => r.json())
      .then((data: NavPayload) => {
        const flat = [
          ...(data.rootItems ?? []),
          ...(data.sections ?? []).flatMap((s) => s.items),
        ];
        setEntries(flat);
      })
      .catch(() => setEntries([]));
  }, [open, entries]);

  const results = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.navTitle ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q),
    );
  }, [entries, query]);

  const goTo = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/docs?slug=${slug}`);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search docs"
        className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search docs...</span>
        <kbd className="ml-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b bg-[var(--tg-primary)] px-6 py-4 text-white">
            <SheetTitle className="text-white">Search docs</SheetTitle>
            <SheetDescription className="text-white/80">
              Matches page titles and descriptions. Full-text search is coming
              later.
            </SheetDescription>
          </SheetHeader>

          <div className="border-b px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search the docs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results.length > 0) {
                    goTo(results[0].slug);
                  }
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {entries === null ? "Loading..." : "No matching docs pages."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {results.map((e) => (
                  <li key={e.slug}>
                    <button
                      onClick={() => goTo(e.slug)}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted"
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {e.navTitle || e.title}
                        </span>
                        {e.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {e.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
