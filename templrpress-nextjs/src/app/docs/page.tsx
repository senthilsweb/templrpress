"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  Menu,
  Search,
  X,
  Lightbulb,
  BookMarked,
  Settings,
} from "lucide-react";
import {
  extractToc,
  useActiveHeading,
  TableOfContents,
  ArticleBody,
} from "@/components/shared/article-renderer";
import { ArticleHeader } from "@/components/shared/article-header";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  title: string;
  slug: string;
  description: string;
  folder: string;
  sortOrder: number;
}

interface NavSection {
  folder: string;
  label: string;
  items: NavItem[];
}

interface FlatEntry {
  folder: string;
  slug: string;
}

interface DocsNavResponse {
  sections: NavSection[];
  rootItems: NavItem[];
  flatOrder: FlatEntry[];
}

interface ArticleContent {
  frontmatter: {
    title: string;
    slug: string;
    description: string;
    date: string;
    author: string;
    type: string;
    category: string;
    tags: string[];
    folder: string;
    url: string;
    sortOrder: number;
  };
  content: string;
}

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
        </div>
      }
    >
      <DocsContent />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty / landing state                                              */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Guides & Tutorials",
    desc: "Step-by-step instructions for setup, configuration, and common workflows.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Lightbulb,
    title: "Best Practices",
    desc: "Recommendations for deployment, security, and production-ready configuration.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Settings,
    title: "Reference",
    desc: "Configuration options, API details, and environment variable reference.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

function DocsEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
      <div className="w-full max-w-2xl space-y-10">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--tg-primary)] to-[var(--tg-accent)] shadow-lg shadow-[var(--tg-primary)]/20">
            <BookMarked className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Documentation
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Guides, references, and how-tos for TemplrGo. Select a document
            from the sidebar to get started, or browse the topics below.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}
              >
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {f.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prev / Next navigation bar                                         */
/* ------------------------------------------------------------------ */

function PrevNextBar({
  flatOrder,
  currentSlug,
  allItems,
  onNavigate,
}: {
  flatOrder: FlatEntry[];
  currentSlug: string;
  allItems: Map<string, NavItem>;
  onNavigate: (folder: string, slug: string) => void;
}) {
  const idx = flatOrder.findIndex((e) => e.slug === currentSlug);
  const prev = idx > 0 ? flatOrder[idx - 1] : null;
  const next = idx >= 0 && idx < flatOrder.length - 1 ? flatOrder[idx + 1] : null;

  const prevItem = prev ? allItems.get(prev.slug) : null;
  const nextItem = next ? allItems.get(next.slug) : null;

  if (!prevItem && !nextItem) return null;

  return (
    <div className="mt-10 flex items-stretch gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
      {prevItem ? (
        <button
          onClick={() => onNavigate(prev!.folder, prev!.slug)}
          className="group flex flex-1 flex-col items-start rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-[var(--tg-primary)]/40 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-[var(--tg-primary)]/40 dark:hover:bg-gray-800/50"
        >
          <span className="mb-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <ChevronLeft className="h-3 w-3" /> Previous
          </span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-[var(--tg-primary)] dark:text-gray-300">
            {prevItem.title}
          </span>
        </button>
      ) : (
        <div className="flex-1" />
      )}

      {nextItem ? (
        <button
          onClick={() => onNavigate(next!.folder, next!.slug)}
          className="group flex flex-1 flex-col items-end rounded-lg border border-gray-200 p-4 text-right transition-colors hover:border-[var(--tg-primary)]/40 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-[var(--tg-primary)]/40 dark:hover:bg-gray-800/50"
        >
          <span className="mb-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            Next <ChevronRight className="h-3 w-3" />
          </span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-[var(--tg-primary)] dark:text-gray-300">
            {nextItem.title}
          </span>
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

function DocsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");

  const [nav, setNav] = useState<DocsNavResponse | null>(null);
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toc = useMemo(
    () => (article ? extractToc(article.content) : []),
    [article],
  );
  const activeHeadingId = useActiveHeading(toc);

  // Build a slug→NavItem lookup for prev/next labels
  const allItemsMap = useMemo(() => {
    const map = new Map<string, NavItem>();
    if (!nav) return map;
    for (const item of nav.rootItems ?? []) map.set(item.slug, item);
    for (const sec of nav.sections ?? []) {
      for (const item of sec.items ?? []) map.set(item.slug, item);
    }
    return map;
  }, [nav]);

  // Fetch navigation tree
  useEffect(() => {
    fetch("/api/cms/docs/nav")
      .then((r) => r.json())
      .then((data: DocsNavResponse) => {
        setNav(data);
        // Default: accordion — only the section containing the current slug
        // is open (or the first section when no slug is selected). This
        // keeps the sidebar compact and predictable.
        const sections = data.sections ?? [];
        let initial: string | null = null;
        if (slug) {
          for (const sec of sections) {
            if (sec.items?.some((i) => i.slug === slug)) {
              initial = sec.folder;
              break;
            }
          }
        }
        if (!initial && sections.length > 0) initial = sections[0].folder;
        setOpenSections(new Set(initial ? [initial] : []));
      })
      .catch(() => {})
      .finally(() => {
        if (!slug) setLoading(false);
      });
  }, [slug]);

  // Fetch single article when slug is present
  useEffect(() => {
    if (!slug) {
      setArticle(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Find the item in nav to know its folder for the correct API path
    const entry = nav?.flatOrder?.find((e) => e.slug === slug);
    const apiPath = entry?.folder
      ? `/api/cms/${entry.folder}/${slug}`
      : `/api/cms/${slug}`;

    fetch(apiPath)
      .then((r) => r.json())
      .then((data) => setArticle(data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug, nav]);

  const navigateTo = useCallback(
    (_folder: string, docSlug: string) => {
      router.push(`/docs?slug=${docSlug}`);
      setMobileSidebarOpen(false);
    },
    [router],
  );

  // Toggle a section — accordion: opening one collapses the rest.
  const toggleSection = useCallback((folder: string) => {
    setOpenSections((prev) => {
      if (prev.has(folder)) return new Set(); // clicking the open one closes it
      return new Set([folder]);
    });
  }, []);

  // Filter nav items by search
  const filteredNav = useMemo(() => {
    if (!nav) return null;
    if (!searchQuery.trim()) return nav;
    const q = searchQuery.toLowerCase();

    const filterItems = (items: NavItem[]) =>
      (items ?? []).filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q),
      );

    const filteredRoot = filterItems(nav.rootItems);
    const filteredSections = (nav.sections ?? [])
      .map((s) => ({ ...s, items: filterItems(s.items) }))
      .filter((s) => s.items.length > 0);

    return {
      ...nav,
      rootItems: filteredRoot,
      sections: filteredSections,
    };
  }, [nav, searchQuery]);

  const totalItems =
    (filteredNav?.rootItems?.length ?? 0) +
    ((filteredNav?.sections ?? []).reduce((n, s) => n + (s.items?.length ?? 0), 0));

  if (loading && !nav) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
      </div>
    );
  }

  /* ---- Sidebar nav tree (shared between desktop & mobile) ---- */
  const sidebarContent = (
    <>
      {/* header */}
      <div className="border-b border-white/10 p-5 pb-4 pt-6">
        <h2 className="text-lg font-bold">Documentation</h2>
        <p className="text-sm opacity-70">Guides &amp; references</p>
      </div>

      {/* search */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search docs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-white/10 py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* nav tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {totalItems === 0 ? (
          <p className="px-4 py-6 text-center text-xs opacity-50">
            {!nav ||
            ((nav.rootItems ?? []).length === 0 && (nav.sections ?? []).length === 0)
              ? "No docs yet"
              : "No matches"}
          </p>
        ) : (
          <>
            {(filteredNav?.rootItems ?? []).map((item) => (
              <SidebarItem
                key={item.slug}
                item={item}
                isActive={slug === item.slug}
                onClick={() => navigateTo(item.folder, item.slug)}
              />
            ))}

            {(filteredNav?.sections ?? []).map((section) => (
              <div key={section.folder} className="mt-1">
                <button
                  onClick={() => toggleSection(section.folder)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white/80"
                >
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                      openSections.has(section.folder) ? "" : "-rotate-90"
                    }`}
                  />
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{section.label}</span>
                  <span className="ml-auto text-[10px] font-normal opacity-40">
                    {section.items.length}
                  </span>
                </button>

                {openSections.has(section.folder) && (
                  <div className="pb-1">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.slug}
                        item={item}
                        isActive={slug === item.slug}
                        onClick={() => navigateTo(item.folder, item.slug)}
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside
            className="relative z-50 flex w-72 flex-col text-white shadow-lg sidebar-themed"
          >
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`relative hidden flex-col text-white shadow-lg transition-all duration-300 md:flex sidebar-themed ${
          sidebarOpen ? "w-72" : "w-[60px]"
        }`}
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute right-3 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-transparent text-white transition-all hover:border-white/50 hover:bg-white/10"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${
              !sidebarOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`flex flex-col h-full overflow-hidden transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-gray-900">
        {!article ? (
          loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <DocsEmptyState />
          )
        ) : (
          <>
            {/* Mobile hamburger */}
            <div className="flex items-center border-b border-gray-200 px-4 py-2 md:hidden dark:border-gray-700">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Menu className="h-4 w-4" />
                Docs
              </button>
            </div>

            {/* Article header */}
            <ArticleHeader
              title={article.frontmatter.title}
              description={article.frontmatter.description}
              author={article.frontmatter.author}
              date={article.frontmatter.date}
              tags={article.frontmatter.tags}
              wordCount={countWords(article.content)}
              breadcrumbs={[
                { label: "Docs", href: "/docs" },
                { label: article.frontmatter.title },
              ]}
              pdfUrl={`/api/cms/pdf/${article.frontmatter.folder ? article.frontmatter.folder + "/" : ""}${article.frontmatter.slug}`}
            />

            {/* Content + ToC */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
                <ArticleBody content={article.content} linkMode="docs" />

                {/* Prev/Next */}
                {nav && slug && (
                  <PrevNextBar
                    flatOrder={nav.flatOrder ?? []}
                    currentSlug={slug}
                    allItems={allItemsMap}
                    onNavigate={navigateTo}
                  />
                )}
              </div>

              {/* Right-side ToC */}
              {toc.length > 0 && (
                <div className="hidden w-56 flex-shrink-0 overflow-y-auto border-l border-gray-200 p-5 xl:block dark:border-gray-700">
                  <TableOfContents toc={toc} activeId={activeHeadingId} />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar item                                                       */
/* ------------------------------------------------------------------ */

function SidebarItem({
  item,
  isActive,
  onClick,
  indent = false,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 text-left text-sm transition-colors ${
        indent ? "pl-9 pr-4" : "px-4"
      } py-2.5 ${
        isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10"
      }`}
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate">{item.title}</span>
        {item.description && (
          <span className="block truncate text-xs opacity-50">
            {item.description}
          </span>
        )}
      </div>
      {isActive && (
        <ChevronRight className="mt-1 h-3 w-3 shrink-0 opacity-70" />
      )}
    </button>
  );
}
