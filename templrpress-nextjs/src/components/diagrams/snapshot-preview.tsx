"use client";

import { useMemo, useRef, useCallback } from "react";
import yamlLib from "js-yaml";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SnapshotCodeBlock } from "./snapshot-code-block";
import { SnapshotImageBlock } from "./snapshot-image-block";
import { SnapshotAnnotations } from "./snapshot-annotations";
import type { SnapshotConfig, SnapshotElement, CanvasConfig } from "./snapshot-types";

/* ── Props ───────────────────────────────────────────────────────── */

interface SnapshotPreviewProps {
  yaml: string;
  showDownload?: boolean;
  className?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function buildCanvasBackground(bg: CanvasConfig["background"]): string {
  if (!bg?.colors?.length) return "#1e1e2e";
  if (bg.type === "solid" || bg.colors.length === 1) return bg.colors[0];
  const angle = bg.angle ?? 135;
  if (bg.type === "radial") {
    return `radial-gradient(circle, ${bg.colors.join(", ")})`;
  }
  return `linear-gradient(${angle}deg, ${bg.colors.join(", ")})`;
}

/* ── Component ───────────────────────────────────────────────────── */

export function SnapshotPreview({
  yaml: yamlString,
  showDownload = true,
  className,
}: SnapshotPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const config = useMemo<SnapshotConfig | null>(() => {
    try {
      const parsed = yamlLib.load(yamlString) as SnapshotConfig;
      if (!parsed || typeof parsed !== "object") return null;
      if (!Array.isArray(parsed.elements) && !Array.isArray(parsed.annotations)) return null;
      return {
        ...parsed,
        canvas: parsed.canvas ?? { width: 1200, height: 800, background: { type: "solid", colors: ["#1e1e2e"] } },
        elements: parsed.elements ?? [],
        annotations: parsed.annotations ?? [],
      };
    } catch {
      return null;
    }
  }, [yamlString]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const url = await toPng(canvasRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config?.title ?? "snapshot"}.png`;
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [config?.title]);

  if (!config) {
    return (
      <div className={cn("flex items-center justify-center rounded-xl border border-dashed border-gray-300 p-12 text-gray-400 dark:border-gray-700", className)}>
        Invalid code-snapshot YAML
      </div>
    );
  }

  const { canvas, elements, annotations } = config;
  const background = buildCanvasBackground(canvas.background);

  // Scale to fit container while keeping aspect ratio
  const aspectRatio = canvas.width / canvas.height;

  return (
    <div className={cn("relative", className)}>
      {/* Download button */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="absolute right-3 top-3 z-20 rounded-lg bg-white/10 p-2 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
          title="Download as PNG"
        >
          <Download className="h-4 w-4" />
        </button>
      )}

      {/* Scaled container */}
      <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio }}>
        <div
          ref={canvasRef}
          className="relative origin-top-left"
          style={{
            width: canvas.width,
            height: canvas.height,
            background,
            transform: "scale(var(--snapshot-scale, 1))",
          }}
        >
          {/* Fit-to-container scaling via CSS custom property */}
          <ScaleObserver canvasWidth={canvas.width} />

          {/* Elements (z-order = array order) */}
          {elements.map((el: SnapshotElement, i: number) => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: el.position.x,
                top: el.position.y,
                zIndex: i + 1,
              }}
            >
              {el.type === "code" && <SnapshotCodeBlock element={el} />}
              {el.type === "image" && <SnapshotImageBlock element={el} />}
            </div>
          ))}

          {/* Annotations overlay */}
          <SnapshotAnnotations annotations={annotations} />
        </div>
      </div>
    </div>
  );
}

/* ── Resize observer for CSS-based scaling ───────────────────────── */

function ScaleObserver({ canvasWidth }: { canvasWidth: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Set --snapshot-scale on the parent based on container width
  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const parent = node.parentElement;
      if (!parent) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const containerW = entry.contentRect.width;
          const scale = containerW / canvasWidth;
          parent.style.setProperty("--snapshot-scale", String(Math.min(scale, 1)));
        }
      });
      // Observe the grandparent (the overflow container)
      const grandparent = parent.parentElement;
      if (grandparent) observer.observe(grandparent);

      // Store ref for cleanup
      (node as unknown as Record<string, unknown>).__resizeObserver = observer;
    },
    [canvasWidth]
  );

  return <div ref={callbackRef} className="absolute inset-0 pointer-events-none" />;
}
