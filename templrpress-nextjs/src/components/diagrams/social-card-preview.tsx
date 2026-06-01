"use client";

import { useMemo, useRef, useCallback } from "react";
import yaml from "js-yaml";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Format definitions (mirrors Go cardFormats) ──────────────────── */

const CARD_FORMATS: Record<string, { width: number; height: number; label: string }> = {
  og:              { width: 1200, height: 630,  label: "Open Graph" },
  og_square:       { width: 1200, height: 1200, label: "OG Square" },
  blog_hero:       { width: 1200, height: 675,  label: "Blog Hero (16:9)" },
  linkedin_cover:  { width: 1584, height: 396,  label: "LinkedIn Cover" },
  linkedin_post:   { width: 1200, height: 627,  label: "LinkedIn Post" },
  linkedin_story:  { width: 1080, height: 1920, label: "LinkedIn Story" },
  insta_post:      { width: 1080, height: 1080, label: "Instagram Post" },
  insta_story:     { width: 1080, height: 1920, label: "Instagram Story" },
  insta_landscape: { width: 1080, height: 566,  label: "Instagram Landscape" },
  insta_portrait:  { width: 1080, height: 1350, label: "Instagram Portrait" },
  twitter_card:    { width: 1200, height: 628,  label: "Twitter Card" },
  twitter_header:  { width: 1500, height: 500,  label: "Twitter Header" },
  whatsapp_status: { width: 1080, height: 1920, label: "WhatsApp Status" },
  youtube_thumb:   { width: 1280, height: 720,  label: "YouTube Thumbnail" },
  youtube_banner:  { width: 2560, height: 1440, label: "YouTube Banner" },
};

/* ── Types ────────────────────────────────────────────────────────── */

interface CardConfig {
  format: string;
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  tags?: string[];
  layout?: string;
  background?: {
    type?: string;
    colors?: string[];
    angle?: number;
    pattern?: string;
  };
  branding?: {
    logo_text?: string;
    url?: string;
    color?: string;
  };
  custom_size?: { width: number; height: number };
}

interface SocialCardPreviewProps {
  yaml: string;
  showDownload?: boolean;
  className?: string;
}

/* ── Component ────────────────────────────────────────────────────── */

export function SocialCardPreview({
  yaml: yamlString,
  showDownload = true,
  className,
}: SocialCardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const card = useMemo<CardConfig | null>(() => {
    try {
      const parsed = yaml.load(yamlString) as CardConfig;
      if (!parsed || typeof parsed !== "object" || !parsed.format) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [yamlString]);

  const dims = useMemo(() => {
    if (!card) return { width: 1200, height: 630 };
    if (card.custom_size?.width && card.custom_size?.height) {
      return { width: card.custom_size.width, height: card.custom_size.height };
    }
    return CARD_FORMATS[card.format] ?? { width: 1200, height: 630 };
  }, [card]);

  const formatLabel = card ? (CARD_FORMATS[card.format]?.label ?? card.format) : "";

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: dims.width,
        height: dims.height,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      const slug = (card?.title ?? "social-card").replace(/\s+/g, "-").toLowerCase().slice(0, 40);
      a.download = `${slug}-${card?.format ?? "og"}.png`;
      a.click();
    } catch {
      // ignore
    }
  }, [card, dims]);

  if (!card) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-gray-400", className)}>
        Invalid social card YAML
      </div>
    );
  }

  const layout = card.layout ?? "modern";
  const bg = card.background ?? { type: "gradient", colors: ["#1e1b4b", "#312e81"] };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Info bar */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-pink-500">
            Social Card
          </span>
          <span className="text-xs text-muted-foreground">
            {formatLabel} · {dims.width}×{dims.height}
          </span>
        </div>
        {showDownload && (
          <button onClick={handleDownload} title="Download PNG" className="p-1 hover:bg-accent rounded">
            <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Scaled card preview */}
      <div className="w-full overflow-auto rounded-lg border border-border bg-muted/30 p-4">
        <div
          style={{
            width: dims.width,
            height: dims.height,
            transformOrigin: "top left",
            transform: `scale(${Math.min(1, 550 / dims.width)})`,
          }}
        >
          <div
            ref={cardRef}
            style={{
              width: dims.width,
              height: dims.height,
              position: "relative",
              overflow: "hidden",
              borderRadius: 12,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              ...buildBackgroundStyle(bg),
            }}
          >
            {/* Pattern overlay */}
            {bg.type === "pattern" && bg.pattern && (
              <PatternOverlay pattern={bg.pattern} w={dims.width} h={dims.height} />
            )}

            {/* Layout */}
            <CardLayout layout={layout} card={card} w={dims.width} h={dims.height} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Background style builder ─────────────────────────────────────── */

function buildBackgroundStyle(bg: CardConfig["background"]): React.CSSProperties {
  if (!bg || !bg.colors?.length) {
    return { background: "linear-gradient(135deg, #1e1b4b, #312e81)" };
  }
  const c = bg.colors;
  switch (bg.type) {
    case "solid":
      return { backgroundColor: c[0] };
    case "radial":
      return { background: `radial-gradient(ellipse at center, ${c[0]}, ${c[1] ?? c[0]})` };
    case "gradient":
    case "pattern":
    default:
      return { background: `linear-gradient(${bg.angle ?? 135}deg, ${c[0]}, ${c[1] ?? c[0]})` };
  }
}

/* ── Pattern overlay ──────────────────────────────────────────────── */

function PatternOverlay({ pattern }: { pattern: string; w: number; h: number }) {
  const svg = useMemo(() => {
    switch (pattern) {
      case "dots":
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Ccircle cx='15' cy='15' r='2' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`;
      case "grid":
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`;
      case "diagonal":
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Cpath d='M0 30L30 0' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`;
      default:
        return "none";
    }
  }, [pattern]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: svg,
        backgroundRepeat: "repeat",
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Layout renderer ──────────────────────────────────────────────── */

function CardLayout({
  layout,
  card,
  w,
  h,
}: {
  layout: string;
  card: CardConfig;
  w: number;
  h: number;
}) {
  const pad = w * 0.06;

  switch (layout) {
    case "minimal":
      return <LayoutMinimal card={card} pad={pad} w={w} h={h} />;
    case "bold":
      return <LayoutBold card={card} pad={pad} w={w} h={h} />;
    case "split":
      return <LayoutSplit card={card} pad={pad} w={w} h={h} />;
    case "centered":
      return <LayoutCentered card={card} pad={pad} w={w} h={h} />;
    case "editorial":
      return <LayoutEditorial card={card} pad={pad} w={w} h={h} />;
    default:
      return <LayoutModern card={card} pad={pad} w={w} h={h} />;
  }
}

interface LayoutProps {
  card: CardConfig;
  pad: number;
  w: number;
  h: number;
}

function LayoutModern({ card, pad, w, h }: LayoutProps) {
  const titleSize = clamp(h * 0.09, 28, 72);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: pad }}>
      {/* Accent bar */}
      <div style={{ width: w * 0.12, height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2, marginBottom: pad * 0.5 }} />
      <div style={{ fontSize: titleSize, fontWeight: 800, color: "#fff", lineHeight: 1.15, maxWidth: w - pad * 2 }}>
        {card.title}
      </div>
      {card.subtitle && (
        <div style={{ fontSize: titleSize * 0.45, color: "rgba(255,255,255,0.78)", marginTop: pad * 0.4, lineHeight: 1.4, maxWidth: w - pad * 2 }}>
          {card.subtitle}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <Tags tags={card.tags} />
      <MetaRow author={card.author} date={card.date} branding={card.branding} />
    </div>
  );
}

function LayoutMinimal({ card, pad, w, h }: LayoutProps) {
  const titleSize = clamp(h * 0.08, 24, 64);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: pad * 1.3 }}>
      <div style={{ fontSize: titleSize, fontWeight: 700, color: "#fff", lineHeight: 1.2, maxWidth: w - pad * 2 }}>
        {card.title}
      </div>
      {card.subtitle && (
        <div style={{ fontSize: titleSize * 0.5, color: "rgba(255,255,255,0.7)", marginTop: pad * 0.4, lineHeight: 1.4 }}>
          {card.subtitle}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <BrandingLabel branding={card.branding} />
    </div>
  );
}

function LayoutBold({ card, pad, w, h }: LayoutProps) {
  const titleSize = clamp(h * 0.14, 36, 120);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: pad }}>
      <div style={{ fontSize: titleSize, fontWeight: 900, color: "#fff", lineHeight: 1.05, maxWidth: w - pad * 2 }}>
        {card.title}
      </div>
      <div style={{ flex: 1 }} />
      <Tags tags={card.tags} />
      <BrandingLabel branding={card.branding} />
    </div>
  );
}

function LayoutSplit({ card, pad, w, h }: LayoutProps) {
  const titleSize = clamp(h * 0.08, 24, 56);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", backgroundColor: "rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: pad, maxWidth: w * 0.5 }}>
        <div style={{ fontSize: titleSize, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
          {card.title}
        </div>
        {card.subtitle && (
          <div style={{ fontSize: titleSize * 0.5, color: "rgba(255,255,255,0.78)", marginTop: pad * 0.3, lineHeight: 1.4 }}>
            {card.subtitle}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <Tags tags={card.tags} />
      </div>
      <BrandingLabel branding={card.branding} style={{ position: "absolute", bottom: pad, right: pad }} />
    </>
  );
}

function LayoutCentered({ card, pad, h }: LayoutProps) {
  const titleSize = clamp(h * 0.09, 28, 72);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: pad, textAlign: "center" }}>
      <div style={{ fontSize: titleSize, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
        {card.title}
      </div>
      {card.subtitle && (
        <div style={{ fontSize: titleSize * 0.45, color: "rgba(255,255,255,0.78)", marginTop: pad * 0.3, lineHeight: 1.4 }}>
          {card.subtitle}
        </div>
      )}
      {(card.tags?.length ?? 0) > 0 && (
        <div style={{ marginTop: pad * 0.8, color: "rgba(255,255,255,0.6)", fontSize: titleSize * 0.3 }}>
          {card.tags!.join("  ·  ")}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <BrandingLabel branding={card.branding} />
    </div>
  );
}

function LayoutEditorial({ card, pad, w, h }: LayoutProps) {
  const titleSize = clamp(h * 0.08, 24, 60);
  return (
    <>
      {/* Dark overlay bottom */}
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
      <div style={{ position: "absolute", top: pad, left: pad }}>
        <Tags tags={card.tags} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: pad, display: "flex", flexDirection: "column", gap: pad * 0.3 }}>
        <div style={{ fontSize: titleSize, fontWeight: 800, color: "#fff", lineHeight: 1.2, maxWidth: w - pad * 2 }}>
          {card.title}
        </div>
        {card.subtitle && (
          <div style={{ fontSize: titleSize * 0.45, color: "rgba(255,255,255,0.78)", lineHeight: 1.4 }}>
            {card.subtitle}
          </div>
        )}
        <MetaRow author={card.author} date={card.date} branding={card.branding} />
      </div>
    </>
  );
}

/* ── Shared sub-components ────────────────────────────────────────── */

function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            padding: "4px 14px",
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          #{t}
        </span>
      ))}
    </div>
  );
}

function MetaRow({
  author,
  date,
  branding,
}: {
  author?: string;
  date?: string;
  branding?: CardConfig["branding"];
}) {
  const parts: string[] = [];
  if (author) parts.push(author);
  if (date) parts.push(date);
  const brandText = branding?.logo_text
    ? branding.url
      ? `${branding.logo_text}  ·  ${branding.url}`
      : branding.logo_text
    : "";

  if (!parts.length && !brandText) return null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
      {parts.length > 0 && (
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
          {parts.join("  ·  ")}
        </span>
      )}
      {brandText && (
        <span style={{ fontSize: 14, fontWeight: 600, color: branding?.color ?? "rgba(255,255,255,0.7)" }}>
          {brandText}
        </span>
      )}
    </div>
  );
}

function BrandingLabel({
  branding,
  style,
}: {
  branding?: CardConfig["branding"];
  style?: React.CSSProperties;
}) {
  if (!branding?.logo_text) return null;
  const text = branding.url ? `${branding.logo_text}  ·  ${branding.url}` : branding.logo_text;
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: branding.color ?? "rgba(255,255,255,0.7)",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

/* ── Util ─────────────────────────────────────────────────────────── */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
