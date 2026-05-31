"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  Code,
  Braces,
  HardDrive,
  ListChecks,
  Settings,
  HelpCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// ── Satellite data ──

interface OrbitFeature {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  badge?: string;
}

const INNER_FEATURES: OrbitFeature[] = [
  {
    href: "/pg-sql-editor/",
    label: "PostgreSQL SQL Editor",
    shortLabel: "PostgreSQL",
    description: "SQL editor, Data Catalog with table & column metadata, and full-server catalog export.",
    icon: Database,
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7, #9333ea)",
    badge: "Updated",
  },
  {
    href: "/openobserve-sql-editor/",
    label: "OpenObserve SQL Editor",
    shortLabel: "OpenObserve",
    description: "Query OpenObserve log data using SQL with CodeMirror editor and tabular results.",
    icon: Code,
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
  },
  {
    href: "/lua-functions/",
    label: "Lua Functions",
    shortLabel: "Lua",
    description: "Serverless Lua scripting — create, store, and execute functions with sandboxed VMs and a web editor.",
    icon: Braces,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    badge: "New",
  },
];

const OUTER_FEATURES: OrbitFeature[] = [
  {
    href: "/boltdb-explorer/",
    label: "BoltDB Explorer",
    shortLabel: "BoltDB",
    description: "Browse BoltDB buckets and keys with CodeMirror value viewer, search, and CSV export.",
    icon: HardDrive,
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    badge: "New",
  },
  {
    href: "/todo/",
    label: "Todo List",
    shortLabel: "Todo",
    description: "Task management with deadlines, status tracking, and KPI filters. Data stored locally in BoltDB.",
    icon: ListChecks,
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
  },
  {
    href: "/faq/",
    label: "FAQ",
    shortLabel: "FAQ",
    description: "Searchable knowledge base with categorized questions and markdown answers.",
    icon: HelpCircle,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  {
    href: "/settings/",
    label: "Settings",
    shortLabel: "Settings",
    description: "Appearance, theme customization, and system preferences.",
    icon: Settings,
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
  },
];

// ── Angle helpers ──

function posOnCircle(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    left: `calc(50% + ${radius * Math.cos(angle)}px)`,
    top: `calc(50% + ${radius * Math.sin(angle)}px)`,
  };
}

// ── Component ──

export function HeroOrbit() {
  const [active, setActive] = useState<OrbitFeature | null>(null);
  const [tipPos, setTipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback((feat: OrbitFeature, el: HTMLElement) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setActive(feat);

    const rect = el.getBoundingClientRect();
    const sceneRect = sceneRef.current?.getBoundingClientRect();
    if (!sceneRect) return;

    const sceneCenterX = sceneRect.left + sceneRect.width / 2;
    let left: number;
    if (rect.left > sceneCenterX) {
      left = rect.right + 12;
    } else {
      left = rect.left - 260 - 12;
    }
    const top = rect.top + rect.height / 2 - 60;
    setTipPos({
      x: Math.max(8, Math.min(left, window.innerWidth - 272)),
      y: Math.max(8, Math.min(top, window.innerHeight - 160)),
    });
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setActive(null), 200);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const paused = active !== null;

  return (
    <div className="relative hidden lg:flex items-center justify-center">
      {/* Scene */}
      <div ref={sceneRef} className="relative w-[460px] h-[460px]">
        {/* Filled concentric circles */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none transition-all duration-500"
          style={{ background: "rgba(var(--tg-primary-rgb, 30,64,175), 0.04)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full pointer-events-none transition-all duration-500"
          style={{ background: "rgba(var(--tg-primary-rgb, 30,64,175), 0.06)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full pointer-events-none transition-all duration-500"
          style={{ background: "rgba(var(--tg-primary-rgb, 30,64,175), 0.08)" }}
        />

        {/* Dashed orbit lines */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full border border-dashed pointer-events-none transition-all duration-500"
          style={{ borderColor: "rgba(var(--tg-primary-rgb, 30,64,175), 0.15)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed pointer-events-none transition-all duration-500"
          style={{ borderColor: "rgba(var(--tg-primary-rgb, 30,64,175), 0.12)" }}
        />

        {/* Center hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full z-20 flex items-center justify-center"
          style={{
            background: "rgba(var(--tg-primary-rgb, 30,64,175), 0.75)",
            boxShadow: "0 0 0 8px rgba(var(--tg-primary-rgb, 30,64,175), 0.12), 0 8px 30px rgba(var(--tg-primary-rgb, 30,64,175), 0.20)",
          }}>
          <div
            className="absolute -inset-2 rounded-full border-2 animate-[hub-pulse_3s_ease-in-out_infinite]"
            style={{ borderColor: "rgba(var(--tg-primary-rgb, 30,64,175), 0.15)" }}
          />
          <div className="text-white text-center select-none">
            <span className="text-[22px] font-extrabold leading-none tracking-tighter">Templr</span>
            <span className="block text-[9px] font-medium uppercase tracking-[1.5px] opacity-70">Go</span>
          </div>
        </div>

        {/* Inner orbit track */}
        <div
          className="absolute left-1/2 top-1/2 w-[260px] h-[260px] -ml-[130px] -mt-[130px] pointer-events-none"
          style={{ animation: paused ? "orbit-spin 55s linear infinite paused" : "orbit-spin 55s linear infinite" }}
        >
          {INNER_FEATURES.map((feat, i) => {
            const pos = posOnCircle(i, INNER_FEATURES.length, 130);
            return (
              <Satellite
                key={feat.href}
                feature={feat}
                style={{
                  ...pos,
                  animation: paused
                    ? "orbit-counter-spin 55s linear infinite paused"
                    : "orbit-counter-spin 55s linear infinite",
                }}
                onEnter={(el) => showTooltip(feat, el)}
                onLeave={scheduleHide}
              />
            );
          })}
        </div>

        {/* Outer orbit track */}
        <div
          className="absolute left-1/2 top-1/2 w-[400px] h-[400px] -ml-[200px] -mt-[200px] pointer-events-none"
          style={{ animation: paused ? "orbit-spin-reverse 75s linear infinite paused" : "orbit-spin-reverse 75s linear infinite" }}
        >
          {OUTER_FEATURES.map((feat, i) => {
            const pos = posOnCircle(i, OUTER_FEATURES.length, 200);
            return (
              <Satellite
                key={feat.href}
                feature={feat}
                style={{
                  ...pos,
                  animation: paused
                    ? "orbit-counter-spin-reverse 75s linear infinite paused"
                    : "orbit-counter-spin-reverse 75s linear infinite",
                }}
                onEnter={(el) => showTooltip(feat, el)}
                onLeave={scheduleHide}
              />
            );
          })}
        </div>

        {/* Ambient particles */}
        <div className="absolute top-[15%] left-[20%] w-[3px] h-[3px] rounded-full bg-indigo-400/25 animate-[orbit-float_6s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute top-[75%] left-[78%] w-[3px] h-[3px] rounded-full bg-green-400/20 animate-[orbit-float_8s_ease-in-out_infinite_-2s] pointer-events-none" />
        <div className="absolute top-[35%] left-[85%] w-[3px] h-[3px] rounded-full bg-purple-400/20 animate-[orbit-float_7s_ease-in-out_infinite_-4s] pointer-events-none" />
      </div>

      {/* Tooltip card */}
      {active && (
        <div
          className="fixed w-[260px] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 transition-all duration-200"
          style={{ left: tipPos.x, top: tipPos.y }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: active.gradient }}>
              <active.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{active.label}</span>
              {active.badge && (
                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {active.badge}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-3">{active.description}</p>
          <Link
            href={active.href}
            className="text-[11px] font-semibold inline-flex items-center gap-1 hover:underline"
            style={{ color: "var(--tg-primary, #1e40af)" }}
          >
            Explore feature
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Satellite bubble ──

function Satellite({
  feature,
  style,
  onEnter,
  onLeave,
}: {
  feature: OrbitFeature;
  style: React.CSSProperties;
  onEnter: (el: HTMLElement) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-gray-900
                 border border-gray-200 dark:border-gray-700 shadow-md
                 flex items-center justify-center pointer-events-auto cursor-pointer
                 transition-all duration-300 z-10
                 hover:scale-125 hover:shadow-xl hover:z-30"
      style={{
        ...style,
        ["--sat-color" as string]: feature.color,
      }}
      onMouseEnter={() => ref.current && onEnter(ref.current)}
      onMouseLeave={onLeave}
    >
      <Icon className="w-[22px] h-[22px] transition-transform duration-300" style={{ color: feature.color }} />
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100"
        style={{ opacity: "var(--label-opacity, 0)" }}>
        {feature.shortLabel}
      </span>
    </div>
  );
}
