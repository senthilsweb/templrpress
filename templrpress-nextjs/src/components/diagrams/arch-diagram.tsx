"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Icon } from "@iconify/react";
import yaml from "js-yaml";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

/* ── YAML Schema Types ──────────────────────────────────────────────── */

interface PopupData {
  icon?: string;
  title?: string;
  badge?: string;
  desc?: string;
  tags?: string[];
}

interface ComponentDef {
  id: string;
  name: string;
  type?: string;
  icon?: string;
  color?: string;
  route?: string;
  sublabel?: string;
  popup?: PopupData;
}

interface BadgeDef {
  text: string;
  color?: string;
}

interface LayerDef {
  id: string;
  label: string;
  color?: string;
  popup?: PopupData;
  badges?: BadgeDef[];
  components?: ComponentDef[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  popup?: PopupData;
}

interface LegendItem {
  type: "swatch" | "dot" | "line";
  color?: string;
  text: string;
}

interface DiagramConfig {
  title?: string;
  subtitle?: string;
  theme?: { bg?: string };
  layers?: LayerDef[];
  sidebar?: { label?: string; items?: SidebarItem[] };
  legend?: LegendItem[];
}

/* ── Props ──────────────────────────────────────────────────────────── */

export interface ArchDiagramProps {
  yaml: string;
  showZoom?: boolean;
  showDownload?: boolean;
  maxHeight?: string;
  className?: string;
}

/* ── Normalize helpers ───────────────────────────────────────────────── */

function normalizeIcon(icon?: string): string | undefined {
  if (!icon) return undefined;
  if (icon.includes(":")) return icon;
  return `lucide:${icon}`;
}

function normalizeConfig(raw: Record<string, unknown>): DiagramConfig {
  const layers = (raw.layers as Record<string, unknown>[] | undefined)?.map(
    (l, i) => {
      const label = (l.label ?? l.name ?? `Layer ${i + 1}`) as string;
      const id = (l.id ?? `layer-${i}`) as string;
      const components = (
        l.components as Record<string, unknown>[] | undefined
      )?.map((c, j) => ({
        ...c,
        id: (c.id ?? `${id}-c${j}`) as string,
        name: (c.name ?? c.label ?? `Component ${j + 1}`) as string,
        icon: normalizeIcon(c.icon as string | undefined),
      })) as ComponentDef[] | undefined;
      return { ...l, id, label, components } as LayerDef;
    }
  );

  const sidebar = raw.sidebar as DiagramConfig["sidebar"];
  if (sidebar?.items) {
    sidebar.items = sidebar.items.map((item, i) => ({
      ...item,
      id: item.id ?? `sb-${i}`,
      icon: normalizeIcon(item.icon),
    }));
  }

  return { ...raw, layers, sidebar } as DiagramConfig;
}

/* ── Zoom steps ─────────────────────────────────────────────────────── */
const ZOOM_STEPS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];

/* ── Component ──────────────────────────────────────────────────────── */

export function ArchDiagram({
  yaml: yamlString,
  showZoom = false,
  showDownload = false,
  maxHeight,
  className,
}: ArchDiagramProps) {
  const [zoomIdx, setZoomIdx] = useState(ZOOM_STEPS.indexOf(100));
  const [activePopup, setActivePopup] = useState<{
    data: PopupData & { _c: string; icon?: string };
    rect: DOMRect;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse YAML
  const { config, error } = useMemo<{
    config: DiagramConfig | null;
    error: string | null;
  }>(() => {
    if (!yamlString?.trim()) return { config: null, error: "No YAML content" };
    try {
      const parsed = yaml.load(yamlString) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object")
        return { config: null, error: "Invalid YAML: not an object" };
      return { config: normalizeConfig(parsed), error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { config: null, error: msg };
    }
  }, [yamlString]);

  // Build popup registry
  const popupMap = useMemo(() => {
    if (!config) return {};
    const map: Record<string, PopupData & { _c: string; icon?: string }> = {};
    const reg = (
      id: string,
      data: PopupData | undefined,
      color: string,
      compIcon?: string
    ) => {
      if (!data) return;
      map[id] = {
        ...data,
        _c: color || "#6366f1",
        icon: compIcon || data.icon || "",
      };
    };

    config.layers?.forEach((layer) => {
      reg(layer.id, layer.popup, layer.color || "#6366f1");
      layer.components?.forEach((comp) => {
        reg(comp.id, comp.popup, comp.color || layer.color || "#6366f1", comp.icon);
      });
    });

    config.sidebar?.items?.forEach((item) => {
      reg(item.id, item.popup, item.color || "#6366f1", item.icon);
    });

    return map;
  }, [config]);

  // Popup show/hide
  const showPopupFor = useCallback(
    (id: string, target: HTMLElement) => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      const data = popupMap[id];
      if (!data) return;
      setActivePopup({ data, rect: target.getBoundingClientRect() });
    },
    [popupMap]
  );

  const hidePopup = useCallback(() => {
    popupTimerRef.current = setTimeout(() => setActivePopup(null), 150);
  }, []);

  const keepPopup = useCallback(() => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
  }, []);

  // Zoom
  const zoomPct = ZOOM_STEPS[zoomIdx];
  const zoomIn = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(i - 1, 0));

  // Download PNG
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor:
          typeof window !== "undefined" && !document.documentElement.classList.contains("dark")
            ? "#f8fafc"
            : "#0f172a",
        pixelRatio: 2,
      });
      const slug = (config?.title || "architecture")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const a = document.createElement("a");
      a.download = `${slug}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error("PNG export failed:", e);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center",
          className
        )}
      >
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-red-400">YAML Parse Error</p>
        <pre className="max-w-lg overflow-auto text-xs text-red-300/80">
          {error}
        </pre>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div
      className={cn("relative", className)}
      style={{ maxHeight: maxHeight || undefined, overflow: maxHeight ? "auto" : undefined }}
    >
      {/* Toolbar */}
      {(showZoom || showDownload) && (
        <div className="mb-3 flex items-center gap-2">
          {showDownload && (
            <button
              onClick={handleDownload}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-indigo-500 hover:bg-white/10 dark:border-white/10 dark:bg-white/5"
              title="Download PNG"
            >
              <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          {showZoom && (
            <>
              <div className="mx-1 h-5 w-px bg-white/10 dark:bg-white/10" />
              <button
                onClick={zoomOut}
                disabled={zoomIdx === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-indigo-500 hover:bg-white/10 disabled:opacity-40 dark:border-white/10 dark:bg-white/5"
              >
                <ZoomOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <span className="min-w-[36px] text-center text-xs font-bold tabular-nums text-gray-500 dark:text-gray-400">
                {zoomPct}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoomIdx === ZOOM_STEPS.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-indigo-500 hover:bg-white/10 disabled:opacity-40 dark:border-white/10 dark:bg-white/5"
              >
                <ZoomIn className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="arch-diagram-canvas"
        style={{
          transform: `scale(${zoomPct / 100})`,
          transformOrigin: "top center",
          transition: "transform 0.2s ease",
        }}
      >
        {/* Title */}
        {config.title && (
          <div className="mb-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {config.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main layout: layers + sidebar */}
        <div className="flex gap-0">
          {/* Layers stack */}
          <div className="relative flex flex-1 flex-col gap-2">
            {/* Flow lines */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              {[15, 35, 55, 75, 90].map((pct, i) => (
                <div
                  key={pct}
                  className="absolute w-px animate-flow-down"
                  style={{
                    left: `${pct}%`,
                    height: `${45 + Math.random() * 25}%`,
                    background:
                      "linear-gradient(to bottom, transparent, rgba(99,102,241,0.12), transparent)",
                    animationDelay: `${-i * 0.9}s`,
                  }}
                />
              ))}
            </div>

            {config.layers?.map((layer, li) => (
              <div key={layer.id}>
                {/* Connector dots between layers */}
                {li > 0 && (
                  <div className="relative z-[2] flex h-0 items-center justify-center overflow-visible">
                    <div className="flex gap-1 opacity-30">
                      <div className="h-[3px] w-[3px] rounded-full bg-gray-500 dark:bg-gray-500" />
                      <div className="h-[3px] w-[3px] animate-dot-pulse rounded-full bg-gray-500 dark:bg-gray-500" style={{ animationDelay: "0.2s" }} />
                      <div className="h-[3px] w-[3px] animate-dot-pulse rounded-full bg-gray-500 dark:bg-gray-500" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}

                {/* Layer */}
                <div
                  className="group/layer relative cursor-default rounded-[14px] border-[1.5px] border-black/8 bg-black/3 p-4 px-5 transition-all duration-300 hover:border-[var(--layer-color)] hover:bg-black/7 hover:shadow-[0_0_30px_color-mix(in_srgb,var(--layer-color)_12%,transparent)] dark:border-white/6 dark:bg-white/4 dark:hover:bg-white/8"
                  style={
                    {
                      "--layer-color": layer.color || "#6366f1",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) =>
                    showPopupFor(layer.id, e.currentTarget)
                  }
                  onMouseLeave={hidePopup}
                >
                  {/* Layer label */}
                  <div
                    className="absolute left-[18px] top-3 text-[9px] font-bold uppercase tracking-[1.5px] opacity-80"
                    style={{ color: layer.color || "#94a3b8" }}
                  >
                    {layer.label}
                  </div>

                  {/* Components */}
                  <div className="flex flex-wrap items-center gap-3 pt-6">
                    {layer.components?.map((comp) => (
                      <div
                        key={comp.id}
                        className="group/card relative flex min-w-[120px] cursor-pointer items-center gap-2.5 rounded-[10px] border border-black/10 bg-black/3 px-4 py-2.5 transition-all duration-250 hover:-translate-y-0.5 hover:border-[var(--card-color)] hover:bg-black/7 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--card-color)_20%,transparent)] dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/10"
                        style={
                          {
                            "--card-color": comp.color || layer.color || "#6366f1",
                          } as React.CSSProperties
                        }
                        onMouseEnter={(e) =>
                          showPopupFor(comp.id, e.currentTarget)
                        }
                        onMouseLeave={hidePopup}
                      >
                        {/* Route label */}
                        {comp.route && (
                          <div
                            className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold opacity-70"
                            style={{
                              color: comp.color || layer.color || "#6366f1",
                            }}
                          >
                            {comp.route}
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: (comp.color || "#6366f1") + "26",
                          }}
                        >
                          <ComponentIcon
                            icon={comp.icon}
                            color={comp.color || layer.color || "#6366f1"}
                          />
                        </div>

                        {/* Info */}
                        <div>
                          <div className="whitespace-nowrap text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {comp.name}
                          </div>
                          {comp.type && (
                            <div className="text-[9px] text-gray-500 dark:text-gray-500">
                              {comp.type}
                            </div>
                          )}
                          {comp.sublabel && (
                            <div className="text-[8px] text-gray-400 dark:text-gray-600">
                              {comp.sublabel}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Badges */}
                    {layer.badges && layer.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-[18px]">
                        {layer.badges.map((b, bi) => (
                          <span
                            key={bi}
                            className="rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-[0.5px]"
                            style={{
                              background: (b.color || "#6366f1") + "1f",
                              color: b.color || "#6366f1",
                            }}
                          >
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          {config.sidebar?.items && config.sidebar.items.length > 0 && (
            <div className="ml-2 flex w-[90px] flex-col gap-2">
              {config.sidebar.label && (
                <div className="py-1 text-center text-[8px] font-bold uppercase tracking-[1.5px] text-gray-400 dark:text-gray-600">
                  {config.sidebar.label}
                </div>
              )}
              {config.sidebar.items.map((item) => (
                <div
                  key={item.id}
                  className="group/obs relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border-[1.5px] border-black/6 px-1.5 py-2.5 transition-all duration-300 hover:translate-x-0.5 hover:border-[var(--obs-color)] hover:shadow-[0_0_24px_color-mix(in_srgb,var(--obs-color)_15%,transparent)] dark:border-white/6"
                  style={
                    {
                      "--obs-color": item.color || "#22d3ee",
                      background: (item.color || "#22d3ee") + "0a",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) =>
                    showPopupFor(item.id, e.currentTarget)
                  }
                  onMouseLeave={hidePopup}
                >
                  <ComponentIcon
                    icon={item.icon}
                    color={item.color || "#94a3b8"}
                    size={20}
                  />
                  <span
                    className="text-[9px] font-bold uppercase tracking-[1px]"
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                      color: item.color || "#94a3b8",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {config.legend && config.legend.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {config.legend.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-500"
              >
                {item.type === "swatch" && (
                  <div
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ background: item.color || "#6366f1" }}
                  />
                )}
                {item.type === "dot" && (
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color || "#6366f1" }}
                  />
                )}
                {item.type === "line" && (
                  <div className="h-0.5 w-[18px] border-t-2 border-dashed border-gray-500 dark:border-gray-500" />
                )}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popup */}
      {activePopup && (
        <div
          className="pointer-events-auto fixed z-[1000] w-80 rounded-[14px] border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-200 dark:border-white/10 dark:bg-slate-800 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{
            left: `${Math.min(activePopup.rect.right + 12, typeof window !== "undefined" ? window.innerWidth - 336 : 600)}px`,
            top: `${Math.min(activePopup.rect.top, typeof window !== "undefined" ? window.innerHeight - 200 : 400)}px`,
          }}
          onMouseEnter={keepPopup}
          onMouseLeave={hidePopup}
        >
          <div className="mb-3 flex items-center gap-3">
            {activePopup.data.icon && (
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: activePopup.data._c + "22",
                }}
              >
                <ComponentIcon
                  icon={activePopup.data.icon}
                  color={activePopup.data._c}
                  size={22}
                />
              </div>
            )}
            <div>
              <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                {activePopup.data.title}
              </span>
              {activePopup.data.badge && (
                <span
                  className="ml-1.5 inline-block rounded px-1.5 py-0.5 align-middle text-[9px] font-bold"
                  style={{
                    background: activePopup.data._c + "18",
                    color: activePopup.data._c,
                  }}
                >
                  {activePopup.data.badge}
                </span>
              )}
            </div>
          </div>
          {activePopup.data.desc && (
            <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              {activePopup.data.desc}
            </p>
          )}
          {activePopup.data.tags && activePopup.data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activePopup.data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-md border border-black/5 bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-white/6 dark:bg-white/6 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global animation styles */}
      <style jsx global>{`
        @keyframes flow-down {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        @keyframes dot-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        .animate-flow-down {
          animation: flow-down 4s linear infinite;
        }
        .animate-dot-pulse {
          animation: dot-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ── Icon renderer ────────────────────────────────────────────────────── */

function ComponentIcon({
  icon,
  color,
  size = 22,
}: {
  icon?: string;
  color: string;
  size?: number;
}) {
  if (!icon) return null;

  // Iconify format: "prefix:name" (e.g. "mdi:web", "simple-icons:docker")
  if (icon.includes(":")) {
    return <Icon icon={icon} style={{ color, fontSize: size }} />;
  }

  // Plain text fallback — render first letter in a circle
  return (
    <span
      className="flex items-center justify-center text-xs font-bold"
      style={{ color, fontSize: size * 0.55 }}
    >
      {icon.charAt(0).toUpperCase()}
    </span>
  );
}
