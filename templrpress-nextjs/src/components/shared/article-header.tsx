"use client";

import { Calendar, Clock, Download, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArticleHeaderProps {
  title: string;
  description?: string;
  author?: string;
  date?: string;
  tags?: string[];
  wordCount?: number;
  breadcrumbs?: { label: string; href?: string }[];
  pdfUrl?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readingTime(wordCount: number): string {
  const mins = Math.max(1, Math.ceil(wordCount / 200));
  return `${mins} min read`;
}

export function ArticleHeader({
  title,
  description,
  author,
  date,
  tags,
  wordCount,
  breadcrumbs,
  pdfUrl,
}: ArticleHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80 md:px-8 md:py-5">
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-[var(--tg-primary)]"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 dark:text-white">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title */}
      <h1 className="mt-2 text-lg font-bold leading-tight text-gray-900 line-clamp-2 dark:text-white md:text-xl lg:text-2xl">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
        {author && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {author}
          </span>
        )}
        {date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(date)}
          </span>
        )}
        {wordCount != null && wordCount > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingTime(wordCount)}
          </span>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {pdfUrl && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => window.open(pdfUrl, "_blank")}
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-[var(--tg-primary)] dark:hover:bg-gray-800 dark:hover:text-[var(--tg-primary)]"
                >
                  <Download className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Download PDF
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
