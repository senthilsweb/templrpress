"use client";

import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Icon } from "@iconify/react";
import { toPng } from "html-to-image";
import {
  Download,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import yaml from "js-yaml";
import { cn } from "@/lib/utils";

/* ── YAML Schema Types ──────────────────────────────────────────────── */

interface PipelineNode {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface PipelineEdge {
  source: string;
  target: string;
  animated?: boolean;
}

interface PipelineConfig {
  title?: string;
  description?: string;
  nodes?: PipelineNode[];
  edges?: PipelineEdge[];
}

/* ── Normalize helpers ───────────────────────────────────────────────── */

function normalizeIcon(icon?: string): string | undefined {
  if (!icon) return undefined;
  if (icon.includes(":")) return icon;
  return `lucide:${icon}`;
}

function normalizeConfig(raw: Record<string, unknown>): PipelineConfig {
  const nodes = (raw.nodes as Record<string, unknown>[] | undefined)?.map(
    (n) => ({
      ...n,
      id: n.id as string,
      name: (n.name ?? n.label ?? n.id) as string,
      icon: normalizeIcon(n.icon as string | undefined),
    })
  ) as PipelineNode[] | undefined;
  return { ...raw, nodes } as PipelineConfig;
}

/* ── Props ──────────────────────────────────────────────────────────── */

export interface PipelineDiagramProps {
  yaml: string;
  showZoom?: boolean;
  showDownload?: boolean;
  maxHeight?: string;
  className?: string;
}

/* ── Custom Node ────────────────────────────────────────────────────── */

interface CustomNodeData {
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  [key: string]: unknown;
}

function CustomNode({ data }: { data: CustomNodeData }) {
  return (
    <div className={`rounded-xl shadow-lg p-3 w-44 ${data.color || "bg-blue-500"}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-300" />
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-white">
          {data.icon ? (
            <Icon icon={data.icon} className="w-12 h-12" />
          ) : (
            <span className="text-2xl font-bold text-gray-400">?</span>
          )}
        </div>
        <div className="font-medium text-sm text-center text-white">{data.label}</div>
        {data.description && (
          <div className="text-[10px] text-white/70 text-center">{data.description}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-300" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

/* ── Layout Helpers ─────────────────────────────────────────────────── */

function calculateLayout(pipelineNodes: PipelineNode[], pipelineEdges: PipelineEdge[]) {
  const levels = new Map<string, number>();
  const processed = new Set<string>();

  const calculateLevel = (nodeId: string, level: number): number => {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    levels.set(nodeId, level);
    processed.add(nodeId);

    const nextNodes = pipelineEdges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.target);

    nextNodes.forEach((targetId) => {
      if (!processed.has(targetId)) {
        calculateLevel(targetId, level + 1);
      }
    });

    return level;
  };

  // Find source nodes (no incoming edges)
  const sourceNodes = pipelineNodes
    .filter((node) => !pipelineEdges.some((edge) => edge.target === node.id))
    .map((node) => node.id);

  sourceNodes.forEach((nodeId) => calculateLevel(nodeId, 0));

  // Assign levels to orphan nodes
  pipelineNodes.forEach((node) => {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  });

  // Group nodes by level
  const nodesByLevel = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(nodeId);
  });

  // Calculate positions
  const xGap = 280;
  const yGap = 140;
  const positions = new Map<string, { x: number; y: number }>();

  nodesByLevel.forEach((nodesInLevel, level) => {
    nodesInLevel.forEach((nodeId, index) => {
      positions.set(nodeId, { x: level * xGap, y: index * yGap });
    });
  });

  return positions;
}

/* ── Inner Flow ─────────────────────────────────────────────────────── */

function PipelineFlow({ config }: { config: PipelineConfig }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect: OnConnect = useCallback(
    () => {},
    []
  );

  useEffect(() => {
    if (!config.nodes || !config.edges) return;

    const positions = calculateLayout(config.nodes, config.edges);

    const newNodes: Node[] = config.nodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: positions.get(node.id) || { x: 0, y: 0 },
      data: {
        label: node.name,
        icon: node.icon,
        color: node.color,
        description: node.description,
      },
    }));

    const newEdges: Edge[] = config.edges.map((edge, index) => ({
      id: `e${index}`,
      source: edge.source,
      target: edge.target,
      animated: edge.animated ?? false,
      style: { stroke: "#999", strokeWidth: 1.5, strokeDasharray: "5,5" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#999",
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [config, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function PipelineDiagram({
  yaml: yamlString,
  showZoom = false,
  showDownload = false,
  maxHeight,
  className,
}: PipelineDiagramProps) {
  const flowRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Parse YAML
  const { config, error } = useMemo<{
    config: PipelineConfig | null;
    error: string | null;
  }>(() => {
    if (!yamlString?.trim()) return { config: null, error: "No YAML content" };
    try {
      const parsed = yaml.load(yamlString) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object")
        return { config: null, error: "Invalid YAML: not an object" };
      const normed = normalizeConfig(parsed);
      if (!normed.nodes || !normed.edges)
        return { config: null, error: "Pipeline YAML requires 'nodes' and 'edges'" };
      return { config: normed, error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { config: null, error: msg };
    }
  }, [yamlString]);

  const handleDownload = useCallback(() => {
    if (!flowRef.current) return;
    const flowElement = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!flowElement) return;

    toPng(flowElement, {
      backgroundColor: "#fff",
      pixelRatio: 2,
    }).then((dataUrl) => {
      const slug = (config?.title || "pipeline")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const a = document.createElement("a");
      a.download = `${slug}.png`;
      a.href = dataUrl;
      a.click();
    }).catch((err) => console.error("PNG export failed:", err));
  }, [config]);

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
    <div className={cn("relative", className)}>
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
                onClick={() => setZoomLevel((z) => Math.max(z - 10, 50))}
                disabled={zoomLevel <= 50}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-indigo-500 hover:bg-white/10 disabled:opacity-40 dark:border-white/10 dark:bg-white/5"
              >
                <ZoomOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <span className="min-w-[36px] text-center text-xs font-bold tabular-nums text-gray-500 dark:text-gray-400">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 10, 200))}
                disabled={zoomLevel >= 200}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-indigo-500 hover:bg-white/10 disabled:opacity-40 dark:border-white/10 dark:bg-white/5"
              >
                <ZoomIn className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Title */}
      {config.title && (
        <div className="mb-2 text-center">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {config.title}
          </h2>
          {config.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* React Flow canvas */}
      <div
        ref={flowRef}
        style={{
          height: maxHeight || "500px",
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: "top center",
          transition: "transform 0.2s ease",
        }}
      >
        <ReactFlowProvider>
          <PipelineFlow config={config} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
