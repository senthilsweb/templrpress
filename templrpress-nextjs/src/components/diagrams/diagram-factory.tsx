"use client";

import { useMemo } from "react";
import yaml from "js-yaml";
import { ArchDiagram } from "./arch-diagram";
import { PipelineDiagram } from "./pipeline-diagram";
import { SocialCardPreview } from "./social-card-preview";
import { SnapshotPreview } from "./snapshot-preview";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────────── */

export type DiagramType = "architecture" | "pipeline" | "social-card" | "code-snapshot" | "unknown";

export interface DiagramPreviewProps {
  yaml: string;
  showZoom?: boolean;
  showDownload?: boolean;
  maxHeight?: string;
  className?: string;
}

/* ── Type Detection ─────────────────────────────────────────────────── */

export function detectDiagramType(yamlString: string): DiagramType {
  if (!yamlString?.trim()) return "unknown";
  try {
    const parsed = yaml.load(yamlString) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return "unknown";
    if (typeof parsed.format === "string") return "social-card";
    if (parsed.type === "code-snapshot" || (Array.isArray(parsed.elements) && Array.isArray(parsed.annotations))) return "code-snapshot";
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return "pipeline";
    if (Array.isArray(parsed.layers) || parsed.components) return "architecture";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/* ── Factory Component ──────────────────────────────────────────────── */

export function DiagramPreview({
  yaml: yamlString,
  showZoom = true,
  showDownload = true,
  maxHeight,
  className,
}: DiagramPreviewProps) {
  const diagramType = useMemo(
    () => detectDiagramType(yamlString),
    [yamlString]
  );

  if (!yamlString?.trim()) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-gray-300 p-12 text-gray-400 dark:border-gray-700",
          className
        )}
      >
        Enter YAML to preview a diagram
      </div>
    );
  }

  if (diagramType === "unknown") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center",
          className
        )}
      >
        <AlertTriangle className="h-8 w-8 text-yellow-400" />
        <p className="text-sm font-medium text-yellow-500">
          Could not detect diagram type
        </p>
        <p className="text-xs text-yellow-400/70">
          Use <code className="font-mono">layers</code> for architecture diagrams,{" "}
          <code className="font-mono">nodes</code> +{" "}
          <code className="font-mono">edges</code> for pipeline diagrams,{" "}
          <code className="font-mono">format</code> for social cards, or{" "}
          <code className="font-mono">type: code-snapshot</code> for snapshot diagrams.
        </p>
      </div>
    );
  }

  if (diagramType === "social-card") {
    return (
      <SocialCardPreview
        yaml={yamlString}
        showDownload={showDownload}
        className={className}
      />
    );
  }

  if (diagramType === "code-snapshot") {
    return (
      <SnapshotPreview
        yaml={yamlString}
        showDownload={showDownload}
        className={className}
      />
    );
  }

  if (diagramType === "pipeline") {
    return (
      <PipelineDiagram
        yaml={yamlString}
        showZoom={showZoom}
        showDownload={showDownload}
        maxHeight={maxHeight}
        className={className}
      />
    );
  }

  return (
    <ArchDiagram
      yaml={yamlString}
      showZoom={showZoom}
      showDownload={showDownload}
      maxHeight={maxHeight}
      className={className}
    />
  );
}
