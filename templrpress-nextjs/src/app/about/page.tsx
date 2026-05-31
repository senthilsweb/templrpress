"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  extractToc,
  useActiveHeading,
  TableOfContents,
  ArticleBody,
} from "@/components/shared/article-renderer";
import { ArticleHeader } from "@/components/shared/article-header";
import { eventBus, EVENTS } from "@/lib/event-bus";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface AboutProfile {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  tags: string[];
  coverImage?: string;
  type: string;
}

interface AboutArticle {
  frontmatter: AboutProfile;
  content: string;
}

function getSlugFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const parts = window.location.pathname.replace(/\/+$/, "").split("/");
  // /about/alex-morgan -> ["", "about", "alex-morgan"]
  return parts.length >= 3 && parts[1] === "about" ? parts[2] : null;
}

export default function AboutPage() {
  const [profiles, setProfiles] = useState<AboutProfile[]>([]);
  const [article, setArticle] = useState<AboutArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug] = useState<string | null>(() => getSlugFromPath());

  useEffect(() => {
    const listPromise = fetch("/api/cms/list?type=about")
      .then((r) => r.json())
      .then((data) => {
        const articles = data.articles ?? data;
        setProfiles(Array.isArray(articles) ? articles : []);
      })
      .catch(() => setProfiles([]));

    if (slug) {
      const articlePromise = fetch(`/api/cms/about/${slug}`)
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((data: AboutArticle) => setArticle(data))
        .catch(() => setArticle(null));

      Promise.all([listPromise, articlePromise]).finally(() => setLoading(false));
    } else {
      listPromise.finally(() => setLoading(false));
    }
  }, [slug]);

  // Emit chatbot context when article loads
  useEffect(() => {
    if (!article) return;
    eventBus.emit(EVENTS.CHAT_CONTEXT_UPDATE, {
      type: "about",
      source: "about-page",
      query: article.frontmatter.title,
      row_count: 1,
      columns: ["title", "description", "author"],
      data: [
        {
          title: article.frontmatter.title,
          description: article.frontmatter.description,
          author: article.frontmatter.author,
        },
      ],
      page: "about",
    });
  }, [article]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
      </div>
    );
  }

  // --- Single article view ---
  if (article) {
    return <AboutDetailView article={article} slug={slug!} />;
  }

  // --- List view ---
  // If only one profile, fetch it inline at /about (no /about/<slug> redirect).
  if (profiles.length === 1 && !article) {
    const only = profiles[0];
    if (typeof window !== "undefined") {
      fetch(`/api/cms/about/${only.slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: AboutArticle | null) => {
          if (data) setArticle(data);
        })
        .catch(() => {});
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tg-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Users className="h-7 w-7 text-[var(--tg-primary)]" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <a
            key={p.slug}
            href={`/about/${p.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <Card className="border-0 shadow-none">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                {p.coverImage && (
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                )}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--tg-primary)] dark:text-white">
                    {p.title}
                  </h2>
                  {p.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {profiles.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400">No profiles found.</p>
      )}
    </div>
  );
}

function AboutDetailView({ article, slug }: { article: AboutArticle; slug: string }) {
  const toc = useMemo(() => extractToc(article.content), [article.content]);
  const activeHeadingId = useActiveHeading(toc);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <ArticleHeader
        title={article.frontmatter.title}
        description={article.frontmatter.description}
        author={article.frontmatter.author}
        date={article.frontmatter.date}
        tags={article.frontmatter.tags}
        wordCount={countWords(article.content)}
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: article.frontmatter.title },
        ]}
        pdfUrl={`/api/cms/pdf/about/${slug}`}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-16 flex-shrink-0 md:block lg:w-48" />

        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-3xl">
            {article.frontmatter.coverImage && (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={article.frontmatter.coverImage}
                  alt={article.frontmatter.title}
                  className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              </div>
            )}
            <ArticleBody content={article.content} />
          </div>
        </div>

        {toc.length > 0 && (
          <div className="hidden w-56 shrink-0 overflow-y-auto border-l border-gray-200 px-4 py-8 xl:block dark:border-gray-700">
            <TableOfContents toc={toc} activeId={activeHeadingId} />
          </div>
        )}
      </div>
    </div>
  );
}
