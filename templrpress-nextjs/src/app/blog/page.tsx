"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Newspaper,
  ChevronRight,
  ChevronLeft,
  FileText,
  Loader2,
  Calendar,
  User,
  LayoutGrid,
  List,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

type ViewMode = "card" | "list";
type SortKey = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "category";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date-desc", label: "Date (newest first)" },
  { key: "date-asc", label: "Date (oldest first)" },
  { key: "title-asc", label: "Title (A–Z)" },
  { key: "title-desc", label: "Title (Z–A)" },
  { key: "category", label: "Category" },
];

function sortArticles(articles: ArticleMeta[], key: SortKey): ArticleMeta[] {
  const sorted = [...articles];
  switch (key) {
    case "date-desc":
      return sorted.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "category":
      return sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    default:
      return sorted;
  }
}

interface ArticleMeta {
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
}

interface ArticleContent {
  frontmatter: ArticleMeta;
  content: string;
}

const PAGE_SIZE = 10;

/* ---- Abstract SVG card backgrounds (theme-aware) ---------------- */

const CARD_PATTERNS = [
  // Pattern 1: Circles + diagonal line
  (i: number) => (
    <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g1-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--tg-primary)", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "var(--tg-accent)", stopOpacity: 0.25 }} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g1-${i})`} />
      <circle cx="320" cy="50" r="80" fill="var(--tg-primary)" opacity="0.12" />
      <circle cx="80" cy="160" r="60" fill="var(--tg-accent)" opacity="0.18" />
      <line x1="0" y1="200" x2="400" y2="0" stroke="var(--tg-primary)" strokeWidth="2" opacity="0.08" />
    </svg>
  ),
  // Pattern 2: Waves
  (i: number) => (
    <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g2-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--tg-accent)", stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: "var(--tg-primary)", stopOpacity: 0.15 }} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g2-${i})`} />
      <path d="M0 120 Q100 80 200 120 T400 120 V200 H0Z" fill="var(--tg-primary)" opacity="0.1" />
      <path d="M0 150 Q100 110 200 150 T400 150 V200 H0Z" fill="var(--tg-accent)" opacity="0.12" />
    </svg>
  ),
  // Pattern 3: Diamond grid
  (i: number) => (
    <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g3-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--tg-primary)", stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: "var(--tg-accent)", stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g3-${i})`} />
      <g opacity="0.1" fill="var(--tg-primary)">
        {[0, 1, 2, 3, 4].map((j) => (
          <rect key={j} x={j * 90 + 20} y={60} width="40" height="40" rx="4"
            transform={`rotate(45 ${j * 90 + 40} 80)`} />
        ))}
      </g>
      <circle cx="350" cy="30" r="50" fill="var(--tg-accent)" opacity="0.15" />
    </svg>
  ),
  // Pattern 4: Dots + arc
  (i: number) => (
    <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g4-${i}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--tg-primary)", stopOpacity: 0.18 }} />
          <stop offset="100%" style={{ stopColor: "var(--tg-accent)", stopOpacity: 0.12 }} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g4-${i})`} />
      <g opacity="0.12" fill="var(--tg-primary)">
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={c * 42 + 20} cy={r * 38 + 20} r="3" />
          ))
        )}
      </g>
      <path d="M-50 250 A200 200 0 0 1 250 -50" fill="none" stroke="var(--tg-accent)" strokeWidth="3" opacity="0.15" />
    </svg>
  ),
  // Pattern 5: Triangles
  (i: number) => (
    <svg viewBox="0 0 400 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g5-${i}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "var(--tg-accent)", stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: "var(--tg-primary)", stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#g5-${i})`} />
      <polygon points="300,20 380,140 220,140" fill="var(--tg-primary)" opacity="0.1" />
      <polygon points="50,60 130,180 -30,180" fill="var(--tg-accent)" opacity="0.12" />
      <polygon points="200,0 240,80 160,80" fill="var(--tg-primary)" opacity="0.08" />
    </svg>
  ),
];

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}

function BlogContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Sort articles — must be above any conditional returns (Rules of Hooks)
  const sorted = useMemo(() => sortArticles(articles, sortKey), [articles, sortKey]);

  // Restore view mode from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("blog-view-mode") as ViewMode | null;
    if (saved === "card" || saved === "list") setViewMode(saved);
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  useEffect(() => {
    fetch("/api/cms/list?type=blog")
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch(() => {})
      .finally(() => {
        if (!slug) setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setArticle(null);
      return;
    }
    setLoading(true);
    fetch(`/api/cms/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => setArticle(data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
      </div>
    );
  }

  // --- Single article view ---
  if (article) {
    return <BlogArticleView article={article} />;
  }

  // --- List / Card view ---
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") localStorage.setItem("blog-view-mode", mode);
  };

  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setSortOpen(false);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-[var(--tg-primary)]" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Blog
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Latest posts and updates
          </p>
        </div>

        {articles.length > 0 && (
          <div className="flex items-center gap-1">
            {/* View toggle */}
            <button
              onClick={() => handleViewMode("card")}
              title="Card view"
              className={`rounded-md p-2 transition ${
                viewMode === "card"
                  ? "bg-[var(--tg-primary)] text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewMode("list")}
              title="List view"
              className={`rounded-md p-2 transition ${
                viewMode === "list"
                  ? "bg-[var(--tg-primary)] text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <List className="h-4 w-4" />
            </button>

            {/* Sort dropdown */}
            <div className="relative ml-1" ref={sortRef}>
              <button
                onClick={() => setSortOpen((o) => !o)}
                title="Sort"
                className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleSort(opt.key)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Check
                        className={`h-3.5 w-3.5 flex-shrink-0 ${
                          sortKey === opt.key ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No blog posts yet
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add markdown files with <code>type: blog</code> frontmatter to see
            them here.
          </p>
        </div>
      ) : (
        <>
          {/* Card view */}
          {viewMode === "card" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((a, idx) => {
                const PatternFn = CARD_PATTERNS[(idx + (page - 1) * PAGE_SIZE) % CARD_PATTERNS.length];
                return (
                  <a
                    key={a.slug}
                    href={`/blog?slug=${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Abstract card header */}
                    <div className="relative h-40 w-full overflow-hidden">
                      {PatternFn(idx + (page - 1) * PAGE_SIZE)}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <h3 className="line-clamp-3 text-center text-lg font-bold text-gray-900/80 dark:text-white/90">
                          {a.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {a.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {a.author}
                          </span>
                        )}
                        {a.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(a.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 font-semibold text-gray-900 group-hover:text-[var(--tg-primary)] dark:text-white">
                        {a.title}
                      </h4>
                      {a.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {a.description}
                        </p>
                      )}
                      {a.tags && a.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {a.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
              {paged.map((a) => (
                <a
                  key={a.slug}
                  href={`/blog?slug=${a.slug}`}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-gray-900 group-hover:text-[var(--tg-primary)] dark:text-white">
                      {a.title}
                    </h4>
                    {a.description && (
                      <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    {a.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {a.category}
                      </Badge>
                    )}
                    {a.tags && a.tags.length > 0 && (
                      <div className="hidden gap-1 sm:flex">
                        {a.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {a.date && (
                      <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {new Date(a.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      page === p
                        ? "bg-[var(--tg-primary)] text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blog article detail — shared renderer + right-side ToC            */
/* ------------------------------------------------------------------ */

function BlogArticleView({ article }: { article: ArticleContent }) {
  const toc = useMemo(() => extractToc(article.content), [article.content]);
  const activeHeadingId = useActiveHeading(toc);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Shared header */}
      <ArticleHeader
        title={article.frontmatter.title}
        description={article.frontmatter.description}
        author={article.frontmatter.author}
        date={article.frontmatter.date}
        tags={article.frontmatter.tags}
        wordCount={countWords(article.content)}
        breadcrumbs={[
          { label: "Blog", href: "/blog" },
          { label: article.frontmatter.title },
        ]}
        pdfUrl={`/api/cms/pdf/${article.frontmatter.slug}`}
      />

      {/* Content + left gutter + ToC */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left gutter — empty space for future nav */}
        <div className="hidden w-16 flex-shrink-0 md:block lg:w-48" />

        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-3xl">
            <ArticleBody content={article.content} />
          </div>
        </div>

        {/* Right-side ToC */}
        {toc.length > 0 && (
          <div className="hidden w-56 shrink-0 overflow-y-auto border-l border-gray-200 px-4 py-8 xl:block dark:border-gray-700">
            <TableOfContents toc={toc} activeId={activeHeadingId} />
          </div>
        )}
      </div>
    </div>
  );
}
