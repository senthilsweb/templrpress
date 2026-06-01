"use client";

import type {
  SnapshotAnnotation,
  LabelAnnotation,
  ArrowAnnotation,
  RectangleAnnotation,
  EllipseAnnotation,
  PolygonAnnotation,
  CurvyArrowAnnotation,
  DoodleArrowAnnotation,
} from "./snapshot-types";

/* ── Component ──────────────────────────────────────────────────── */

interface Props {
  annotations: SnapshotAnnotation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDragStart?: (e: React.MouseEvent, id: string) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
  onArrowEndpointStart?: (e: React.MouseEvent, id: string, endpoint: "from" | "to", px: number, py: number) => void;
  onCurvyPointStart?: (e: React.MouseEvent, id: string, point: "from" | "to" | "control1" | "control2", px: number, py: number) => void;
  onLabelDoubleClick?: (id: string) => void;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
}

export function SnapshotAnnotations({ annotations, selectedId, onSelect, onDragStart, onResizeStart, onArrowEndpointStart, onCurvyPointStart, onLabelDoubleClick, onRotateStart }: Props) {
  return (
    <svg
      className="absolute inset-0"
      style={{ width: "100%", height: "100%", zIndex: 1000, pointerEvents: "none" }}
    >
      {annotations.map((ann) => {
        const isSelected = selectedId === ann.id;
        const handleMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation();
          onSelect?.(ann.id);
          onDragStart?.(e, ann.id);
        };
        switch (ann.type) {
          case "label":
            return (
              <LabelSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onResizeStart={onResizeStart}
                onDoubleClick={() => onLabelDoubleClick?.(ann.id)}
                onRotateStart={onRotateStart}
              />
            );
          case "arrow":
            return (
              <ArrowSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onEndpointStart={onArrowEndpointStart}
              />
            );
          case "rectangle":
            return (
              <RectSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onResizeStart={onResizeStart}
                onRotateStart={onRotateStart}
              />
            );
          case "ellipse":
            return (
              <EllipseSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onResizeStart={onResizeStart}
                onRotateStart={onRotateStart}
              />
            );
          case "polygon":
            return (
              <PolygonSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onResizeStart={onResizeStart}
                onRotateStart={onRotateStart}
              />
            );
          case "curvy-arrow":
            return (
              <CurvyArrowSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onPointStart={onCurvyPointStart}
              />
            );
          case "doodle-arrow":
            return (
              <DoodleArrowSVG
                key={ann.id}
                ann={ann}
                selected={isSelected}
                onMouseDown={handleMouseDown}
                onEndpointStart={onArrowEndpointStart}
              />
            );
          case "highlight":
            return null;
          default:
            return null;
        }
      })}
    </svg>
  );
}

/** Renders a single annotation inside its own absolute SVG — used for unified z-order rendering. */
export function SingleAnnotationSVG({
  ann,
  selectedId,
  onSelect,
  onDragStart,
  onResizeStart,
  onArrowEndpointStart,
  onCurvyPointStart,
  onLabelDoubleClick,
  onRotateStart,
}: {
  ann: SnapshotAnnotation;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDragStart?: (e: React.MouseEvent, id: string) => void;
  onResizeStart?: Props["onResizeStart"];
  onArrowEndpointStart?: Props["onArrowEndpointStart"];
  onCurvyPointStart?: Props["onCurvyPointStart"];
  onLabelDoubleClick?: (id: string) => void;
  onRotateStart?: Props["onRotateStart"];
}) {
  const isSelected = selectedId === ann.id;
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(ann.id);
    onDragStart?.(e, ann.id);
  };
  let content: React.ReactNode = null;
  switch (ann.type) {
    case "label":
      content = (
        <LabelSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onResizeStart={onResizeStart}
          onDoubleClick={() => onLabelDoubleClick?.(ann.id)}
          onRotateStart={onRotateStart}
        />
      );
      break;
    case "arrow":
      content = (
        <ArrowSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onEndpointStart={onArrowEndpointStart}
        />
      );
      break;
    case "rectangle":
      content = (
        <RectSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onResizeStart={onResizeStart}
          onRotateStart={onRotateStart}
        />
      );
      break;
    case "ellipse":
      content = (
        <EllipseSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onResizeStart={onResizeStart}
          onRotateStart={onRotateStart}
        />
      );
      break;
    case "polygon":
      content = (
        <PolygonSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onResizeStart={onResizeStart}
          onRotateStart={onRotateStart}
        />
      );
      break;
    case "curvy-arrow":
      content = (
        <CurvyArrowSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onPointStart={onCurvyPointStart}
        />
      );
      break;
    case "doodle-arrow":
      content = (
        <DoodleArrowSVG
          ann={ann}
          selected={isSelected}
          onMouseDown={handleMouseDown}
          onEndpointStart={onArrowEndpointStart}
        />
      );
      break;
  }
  if (!content) return null;
  return (
    <svg
      className="absolute inset-0"
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {content}
    </svg>
  );
}

/* ── Shared resize handle helper ─────────────────────────────────── */

function ResizeHandlesSVG({
  id, x, y, w, h, onResizeStart,
}: {
  id: string; x: number; y: number; w: number; h: number;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
}) {
  const corners = [
    { hid: "nw", cx: x, cy: y, cursor: "nwse-resize" },
    { hid: "ne", cx: x + w, cy: y, cursor: "nesw-resize" },
    { hid: "sw", cx: x, cy: y + h, cursor: "nesw-resize" },
    { hid: "se", cx: x + w, cy: y + h, cursor: "nwse-resize" },
    { hid: "n", cx: x + w / 2, cy: y, cursor: "ns-resize" },
    { hid: "s", cx: x + w / 2, cy: y + h, cursor: "ns-resize" },
    { hid: "w", cx: x, cy: y + h / 2, cursor: "ew-resize" },
    { hid: "e", cx: x + w, cy: y + h / 2, cursor: "ew-resize" },
  ];
  return (
    <>
      {corners.map((c) => (
        <circle
          key={c.hid}
          cx={c.cx}
          cy={c.cy}
          r={5}
          fill="white"
          stroke="var(--tg-primary, #6366f1)"
          strokeWidth={2}
          style={{ cursor: c.cursor }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart?.(e, id, c.hid, x, y, w, h);
          }}
        />
      ))}
    </>
  );
}

/* ── SVG Rotation Handle ─────────────────────────────────────── */

function RotationHandleSVG({
  id, cx, topY, onRotateStart,
}: {
  id: string;
  cx: number;
  topY: number;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
  currentRotation?: number;
  centerY?: number;
}) {
  const handleY = topY - 28;
  return (
    <>
      <line x1={cx} y1={topY} x2={cx} y2={handleY + 8} stroke="var(--tg-primary, #6366f1)" strokeWidth={1.5} />
      <circle
        cx={cx}
        cy={handleY}
        r={7}
        fill="white"
        stroke="var(--tg-primary, #6366f1)"
        strokeWidth={2}
        style={{ cursor: "grab" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRotateStart?.(e, id, cx, topY, 0);
        }}
      />
    </>
  );
}

/* ── Label ───────────────────────────────────────────────────────── */

function LabelSVG({
  ann, selected, onMouseDown, onResizeStart, onDoubleClick, onRotateStart,
}: {
  ann: LabelAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
  onDoubleClick?: () => void;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
}) {
  const s = ann.style;
  const px = s.padding?.x ?? 12;
  const py = s.padding?.y ?? 6;
  const fs = s.font_size ?? 14;
  const r = s.border_radius ?? 6;
  const w = ann.size?.width ?? (ann.text.length * fs * 0.6 + px * 2);
  const h = ann.size?.height ?? (fs + py * 2);
  const rot = ann.rotation ?? 0;
  const cx = ann.position.x + w / 2;
  const cy = ann.position.y + h / 2;

  return (
    <g
      style={{ pointerEvents: "auto", cursor: "pointer" }}
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
      transform={rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined}
    >
      {selected && (
        <rect x={ann.position.x - 2} y={ann.position.y - 2} width={w + 4} height={h + 4}
          rx={r} ry={r} fill="none" stroke="var(--tg-primary, #6366f1)" strokeWidth={2} strokeDasharray="4 2" />
      )}
      <rect
        x={ann.position.x}
        y={ann.position.y}
        rx={r}
        ry={r}
        width={w}
        height={h}
        fill={s.background ?? "#ffffff"}
        stroke={s.border_color ?? "none"}
        strokeWidth={s.border_width ?? 0}
        strokeDasharray={s.border_style === "dashed" ? "8 4" : s.border_style === "dotted" ? "2 2" : undefined}
        opacity={0.95}
      />
      <text
        x={s.text_align === "center" ? ann.position.x + w / 2 : s.text_align === "right" ? ann.position.x + w - px : ann.position.x + px}
        y={ann.position.y + h / 2}
        dominantBaseline="central"
        textAnchor={s.text_align === "center" ? "middle" : s.text_align === "right" ? "end" : "start"}
        fill={s.color ?? "#000000"}
        fontSize={fs}
        fontWeight={s.font_weight ?? "normal"}
        fontFamily={s.font_family ?? "system-ui, sans-serif"}
        fontStyle={s.font_style ?? "normal"}
        textDecoration={s.text_decoration ?? "none"}
      >
        {ann.text}
      </text>
      {/* Resize handles */}
      {selected && (
        <ResizeHandlesSVG id={ann.id} x={ann.position.x} y={ann.position.y} w={w} h={h} onResizeStart={onResizeStart} />
      )}
      {/* Rotation handle */}
      {selected && (
        <RotationHandleSVG id={ann.id} cx={cx} topY={ann.position.y} onRotateStart={(e, id, hcx, hcy) => onRotateStart?.(e, id, cx, cy, rot)} />
      )}
    </g>
  );
}

/* ── Arrow ───────────────────────────────────────────────────────── */

function ArrowSVG({
  ann,
  selected,
  onMouseDown,
  onEndpointStart,
}: {
  ann: ArrowAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onEndpointStart?: (e: React.MouseEvent, id: string, endpoint: "from" | "to", px: number, py: number) => void;
}) {
  const s = ann.style;
  const color = s.color ?? "#ffffff";
  const sw = s.stroke_width ?? 2;
  const headMarkerId = `arrowhead-${ann.id}`;
  const tailMarkerId = `arrowtail-${ann.id}`;

  // Path
  let d: string;
  if (s.curve === "bezier") {
    const cx = (ann.from.x + ann.to.x) / 2;
    const cy1 = ann.from.y;
    const cy2 = ann.to.y;
    d = `M ${ann.from.x} ${ann.from.y} C ${cx} ${cy1}, ${cx} ${cy2}, ${ann.to.x} ${ann.to.y}`;
  } else if (s.curve === "step") {
    const midY = (ann.from.y + ann.to.y) / 2;
    d = `M ${ann.from.x} ${ann.from.y} L ${ann.from.x} ${midY} L ${ann.to.x} ${midY} L ${ann.to.x} ${ann.to.y}`;
  } else {
    d = `M ${ann.from.x} ${ann.from.y} L ${ann.to.x} ${ann.to.y}`;
  }

  const renderMarker = (markerId: string, kind: string, isHead: boolean) => {
    if (kind === "none") return null;
    if (kind === "dot") {
      return (
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="3" fill={color} />
        </marker>
      );
    }
    if (kind === "circle") {
      return (
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth={1.5} />
        </marker>
      );
    }
    if (kind === "diamond") {
      return (
        <marker id={markerId} markerWidth="12" markerHeight="10" refX="6" refY="5" orient="auto">
          <path d="M 0 5 L 6 0 L 12 5 L 6 10 Z" fill={color} />
        </marker>
      );
    }
    if (kind === "bar") {
      return (
        <marker id={markerId} markerWidth="4" markerHeight="10" refX="2" refY="5" orient="auto">
          <line x1="2" y1="0" x2="2" y2="10" stroke={color} strokeWidth={2} />
        </marker>
      );
    }
    if (kind === "open-arrow") {
      return (
        <marker id={markerId} markerWidth="12" markerHeight="10" refX={isHead ? 10 : 2} refY="5" orient="auto" markerUnits="strokeWidth">
          <path d={isHead ? "M 0 0 L 10 5 L 0 10" : "M 10 0 L 0 5 L 10 10"} stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      );
    }
    if (kind === "triangle") {
      return (
        <marker id={markerId} markerWidth="10" markerHeight="10" refX={isHead ? 9 : 1} refY="5" orient="auto" markerUnits="strokeWidth">
          <path d={isHead ? "M 0 0 L 10 5 L 0 10 Z" : "M 10 0 L 0 5 L 10 10 Z"} fill={color} />
        </marker>
      );
    }
    // Default: filled arrow
    return (
      <marker
        id={markerId}
        markerWidth="10"
        markerHeight="8"
        refX={isHead ? 8 : 2}
        refY="4"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d={isHead ? "M 0 0 L 10 4 L 0 8 Z" : "M 10 0 L 0 4 L 10 8 Z"} fill={color} />
      </marker>
    );
  };

  const headKind = s.head ?? "arrow";
  const tailKind = s.tail ?? "none";
  const dashArray = s.dash === "dashed" ? "8 4" : s.dash === "dotted" ? "2 2" : undefined;

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown}>
      {/* Invisible wide hit area for easier clicking */}
      <path d={d} stroke="transparent" strokeWidth={Math.max(sw + 12, 16)} fill="none" />
      {selected && <path d={d} stroke="var(--tg-primary, #6366f1)" strokeWidth={sw + 4} fill="none" strokeDasharray="6 3" />}
      <defs>
        {renderMarker(headMarkerId, headKind, true)}
        {renderMarker(tailMarkerId, tailKind, false)}
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeDasharray={dashArray}
        markerEnd={headKind !== "none" ? `url(#${headMarkerId})` : undefined}
        markerStart={tailKind !== "none" ? `url(#${tailMarkerId})` : undefined}
      />

      {/* Draggable endpoint handles (visible when selected) */}
      {selected && (
        <>
          <circle
            cx={ann.from.x}
            cy={ann.from.y}
            r={6}
            fill="var(--tg-primary, #6366f1)"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointStart?.(e, ann.id, "from", ann.from.x, ann.from.y);
            }}
          />
          <circle
            cx={ann.to.x}
            cy={ann.to.y}
            r={6}
            fill="var(--tg-primary, #6366f1)"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointStart?.(e, ann.id, "to", ann.to.x, ann.to.y);
            }}
          />
        </>
      )}
    </g>
  );
}

/* ── Rectangle ──────────────────────────────────────────────────── */

function RectSVG({
  ann,
  selected,
  onMouseDown,
  onResizeStart,
  onRotateStart,
}: {
  ann: RectangleAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
}) {
  const s = ann.style;
  const { x, y } = ann.position;
  const { width: w, height: h } = ann.size;
  const rot = ann.rotation ?? 0;
  const cx = x + w / 2;
  const cy = y + h / 2;

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown} transform={rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined}>
      {selected && (
        <rect
          x={x - 3} y={y - 3}
          width={w + 6} height={h + 6}
          rx={(s.border_radius ?? 0) + 2} ry={(s.border_radius ?? 0) + 2}
          fill="none" stroke="var(--tg-primary, #6366f1)" strokeWidth={2} strokeDasharray="4 2"
        />
      )}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={s.border_radius ?? 0}
        ry={s.border_radius ?? 0}
        stroke={s.border_color ?? "#ef4444"}
        strokeWidth={s.border_width ?? 2}
        strokeDasharray={s.border_style === "dashed" ? "8 4" : s.border_style === "dotted" ? "2 2" : undefined}
        fill={s.fill === "transparent" ? "none" : (s.fill ?? "none")}
      />
      {selected && (
        <ResizeHandlesSVG id={ann.id} x={x} y={y} w={w} h={h} onResizeStart={onResizeStart} />
      )}
      {selected && (
        <RotationHandleSVG id={ann.id} cx={cx} topY={y} onRotateStart={(e, id, hcx, hcy) => onRotateStart?.(e, id, cx, cy, rot)} />
      )}
    </g>
  );
}

/* ── Ellipse ────────────────────────────────────────────────────── */

function EllipseSVG({
  ann,
  selected,
  onMouseDown,
  onResizeStart,
  onRotateStart,
}: {
  ann: EllipseAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
}) {
  const s = ann.style;
  const { x, y } = ann.position;
  const { width: w, height: h } = ann.size;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const rot = ann.rotation ?? 0;

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown} transform={rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined}>
      {selected && (
        <ellipse
          cx={cx} cy={cy} rx={rx + 3} ry={ry + 3}
          fill="none" stroke="var(--tg-primary, #6366f1)" strokeWidth={2} strokeDasharray="4 2"
        />
      )}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        stroke={s.border_color ?? "#22d3ee"}
        strokeWidth={s.border_width ?? 2}
        strokeDasharray={s.border_style === "dashed" ? "8 4" : s.border_style === "dotted" ? "2 2" : undefined}
        fill={s.fill === "transparent" ? "none" : (s.fill ?? "none")}
      />
      {selected && (
        <ResizeHandlesSVG id={ann.id} x={x} y={y} w={w} h={h} onResizeStart={onResizeStart} />
      )}
      {selected && (
        <RotationHandleSVG id={ann.id} cx={cx} topY={y} onRotateStart={(e, id, hcx, hcy) => onRotateStart?.(e, id, cx, cy, rot)} />
      )}
    </g>
  );
}

/* ── Polygon ───────────────────────────────────────────────────── */

function PolygonSVG({
  ann,
  selected,
  onMouseDown,
  onResizeStart,
  onRotateStart,
}: {
  ann: PolygonAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, id: string, handle: string, x: number, y: number, w: number, h: number) => void;
  onRotateStart?: (e: React.MouseEvent, id: string, cx: number, cy: number, currentRotation: number) => void;
}) {
  const s = ann.style;
  const { x, y } = ann.position;
  const { width: w, height: h } = ann.size;
  const sides = s.sides ?? 6;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const rot = ann.rotation ?? 0;

  const points: string = Array.from({ length: sides })
    .map((_, i) => {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);
      return `${px},${py}`;
    })
    .join(" ");

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown} transform={rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined}>
      {selected && (
        <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6}
          fill="none" stroke="var(--tg-primary, #6366f1)" strokeWidth={2} strokeDasharray="4 2" />
      )}
      <polygon
        points={points}
        stroke={s.border_color ?? "#f59e0b"}
        strokeWidth={s.border_width ?? 2}
        strokeDasharray={s.border_style === "dashed" ? "8 4" : s.border_style === "dotted" ? "2 2" : undefined}
        fill={s.fill === "transparent" ? "none" : (s.fill ?? "none")}
        strokeLinejoin="round"
      />
      {selected && (
        <ResizeHandlesSVG id={ann.id} x={x} y={y} w={w} h={h} onResizeStart={onResizeStart} />
      )}
      {selected && (
        <RotationHandleSVG id={ann.id} cx={cx} topY={y} onRotateStart={(e, id, hcx, hcy) => onRotateStart?.(e, id, cx, cy, rot)} />
      )}
    </g>
  );
}

/* ── Curvy Arrow ─────────────────────────────────────────────────── */

function CurvyArrowSVG({
  ann,
  selected,
  onMouseDown,
  onPointStart,
}: {
  ann: CurvyArrowAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onPointStart?: (e: React.MouseEvent, id: string, point: "from" | "to" | "control1" | "control2", px: number, py: number) => void;
}) {
  const s = ann.style;
  const color = s.color ?? "#ffffff";
  const sw = s.stroke_width ?? 2;
  const rot = ann.rotation ?? 0;
  const headMarkerId = `curvy-head-${ann.id}`;
  const tailMarkerId = `curvy-tail-${ann.id}`;

  // Compute default control points if not set
  const { from, to } = ann;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const offset = dist * 0.4;

  const c1 = ann.control1 ?? { x: midX + perpX * offset, y: midY + perpY * offset };
  const c2 = ann.control2 ?? { x: midX - perpX * offset * 0.3, y: midY - perpY * offset * 0.3 };

  // Build cubic bezier path
  const d = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;

  // Center for rotation
  const centerX = (from.x + to.x + c1.x + c2.x) / 4;
  const centerY = (from.y + to.y + c1.y + c2.y) / 4;

  const headKind = s.head ?? "arrow";
  const tailKind = s.tail ?? "none";
  const dashArray = s.dash === "dashed" ? "8 4" : s.dash === "dotted" ? "2 2" : undefined;

  const renderMarker = (markerId: string, kind: string, isHead: boolean) => {
    if (kind === "none") return null;
    if (kind === "dot") {
      return (
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="3" fill={color} />
        </marker>
      );
    }
    if (kind === "circle") {
      return (
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth={1.5} />
        </marker>
      );
    }
    if (kind === "diamond") {
      return (
        <marker id={markerId} markerWidth="12" markerHeight="10" refX="6" refY="5" orient="auto">
          <path d="M 0 5 L 6 0 L 12 5 L 6 10 Z" fill={color} />
        </marker>
      );
    }
    if (kind === "bar") {
      return (
        <marker id={markerId} markerWidth="4" markerHeight="10" refX="2" refY="5" orient="auto">
          <line x1="2" y1="0" x2="2" y2="10" stroke={color} strokeWidth={2} />
        </marker>
      );
    }
    if (kind === "open-arrow") {
      return (
        <marker id={markerId} markerWidth="12" markerHeight="10" refX={isHead ? 10 : 2} refY="5" orient="auto" markerUnits="strokeWidth">
          <path d={isHead ? "M 0 0 L 10 5 L 0 10" : "M 10 0 L 0 5 L 10 10"} stroke={color} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      );
    }
    if (kind === "triangle") {
      return (
        <marker id={markerId} markerWidth="10" markerHeight="10" refX={isHead ? 9 : 1} refY="5" orient="auto" markerUnits="strokeWidth">
          <path d={isHead ? "M 0 0 L 10 5 L 0 10 Z" : "M 10 0 L 0 5 L 10 10 Z"} fill={color} />
        </marker>
      );
    }
    return (
      <marker id={markerId} markerWidth="10" markerHeight="8" refX={isHead ? 8 : 2} refY="4" orient="auto" markerUnits="strokeWidth">
        <path d={isHead ? "M 0 0 L 10 4 L 0 8 Z" : "M 10 0 L 0 4 L 10 8 Z"} fill={color} />
      </marker>
    );
  };

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown} transform={rot ? `rotate(${rot}, ${centerX}, ${centerY})` : undefined}>
      {/* Hit area */}
      <path d={d} stroke="transparent" strokeWidth={Math.max(sw + 12, 16)} fill="none" />
      {selected && <path d={d} stroke="var(--tg-primary, #6366f1)" strokeWidth={sw + 4} fill="none" strokeDasharray="6 3" />}
      <defs>
        {renderMarker(headMarkerId, headKind, true)}
        {renderMarker(tailMarkerId, tailKind, false)}
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeDasharray={dashArray}
        markerEnd={headKind !== "none" ? `url(#${headMarkerId})` : undefined}
        markerStart={tailKind !== "none" ? `url(#${tailMarkerId})` : undefined}
      />

      {/* Control point handles (visible when selected) */}
      {selected && (
        <>
          {/* Tangent lines from endpoints to control points */}
          <line x1={from.x} y1={from.y} x2={c1.x} y2={c1.y}
            stroke="rgba(34,197,94,0.5)" strokeWidth={1} strokeDasharray="4 2" />
          <line x1={to.x} y1={to.y} x2={c2.x} y2={c2.y}
            stroke="rgba(34,197,94,0.5)" strokeWidth={1} strokeDasharray="4 2" />

          {/* From endpoint */}
          <circle cx={from.x} cy={from.y} r={6}
            fill="var(--tg-primary, #6366f1)" stroke="white" strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => { e.stopPropagation(); onPointStart?.(e, ann.id, "from", from.x, from.y); }}
          />
          {/* To endpoint */}
          <circle cx={to.x} cy={to.y} r={6}
            fill="var(--tg-primary, #6366f1)" stroke="white" strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => { e.stopPropagation(); onPointStart?.(e, ann.id, "to", to.x, to.y); }}
          />
          {/* Control point 1 (green) */}
          <circle cx={c1.x} cy={c1.y} r={5}
            fill="#22c55e" stroke="white" strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => { e.stopPropagation(); onPointStart?.(e, ann.id, "control1", c1.x, c1.y); }}
          />
          {/* Control point 2 (green) */}
          <circle cx={c2.x} cy={c2.y} r={5}
            fill="#22c55e" stroke="white" strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => { e.stopPropagation(); onPointStart?.(e, ann.id, "control2", c2.x, c2.y); }}
          />
        </>
      )}
    </g>
  );
}

/* ── Seeded random for hand-drawn jitter (deterministic per seed) ── */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/* ── Doodle / Hand-drawn Arrow ───────────────────────────────────── */

function DoodleArrowSVG({
  ann,
  selected,
  onMouseDown,
  onEndpointStart,
}: {
  ann: DoodleArrowAnnotation;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onEndpointStart?: (e: React.MouseEvent, id: string, endpoint: "from" | "to", px: number, py: number) => void;
}) {
  const s = ann.style;
  const color = s.color ?? "#ffffff";
  const sw = s.stroke_width ?? 2.5;
  const rot = ann.rotation ?? 0;
  const headMarkerId = `doodle-head-${ann.id}`;
  const tailMarkerId = `doodle-tail-${ann.id}`;

  const { from, to } = ann;
  const seed = s.seed ?? 42;
  const rand = seededRandom(seed);

  // Compute a hand-drawn curved path with jitter
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / dist;
  const perpY = dx / dist;

  // Create a natural curve with jittery control points
  const jitter = (v: number, amount: number) => v + (rand() - 0.5) * amount;
  const curveAmount = dist * 0.3;
  const jitterAmount = Math.min(dist * 0.08, 12);

  // Generate multiple points along the curve for a hand-drawn feel
  const numSegments = 6;
  const points: { x: number; y: number }[] = [from];

  for (let i = 1; i < numSegments; i++) {
    const t = i / numSegments;
    const baseX = from.x + dx * t;
    const baseY = from.y + dy * t;
    const curveFactor = Math.sin(t * Math.PI) * curveAmount * (0.6 + rand() * 0.4);
    const px = jitter(baseX + perpX * curveFactor, jitterAmount);
    const py = jitter(baseY + perpY * curveFactor, jitterAmount);
    points.push({ x: px, y: py });
  }
  points.push(to);

  // Build smooth path through points using catmull-rom → cubic bezier
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // A second slightly offset stroke for the sketchy double-line effect
  const rand2 = seededRandom(seed + 7);
  const jitter2 = (v: number, amount: number) => v + (rand2() - 0.5) * amount;
  const points2: { x: number; y: number }[] = [{ x: from.x + (rand2() - 0.5) * 2, y: from.y + (rand2() - 0.5) * 2 }];
  for (let i = 1; i < numSegments; i++) {
    const t = i / numSegments;
    const baseX = from.x + dx * t;
    const baseY = from.y + dy * t;
    const curveFactor = Math.sin(t * Math.PI) * curveAmount * (0.6 + rand2() * 0.4);
    const px = jitter2(baseX + perpX * curveFactor, jitterAmount * 1.2);
    const py = jitter2(baseY + perpY * curveFactor, jitterAmount * 1.2);
    points2.push({ x: px, y: py });
  }
  points2.push({ x: to.x + (rand2() - 0.5) * 2, y: to.y + (rand2() - 0.5) * 2 });

  let d2 = `M ${points2[0].x} ${points2[0].y}`;
  for (let i = 0; i < points2.length - 1; i++) {
    const p0 = points2[Math.max(i - 1, 0)];
    const p1 = points2[i];
    const p2 = points2[i + 1];
    const p3 = points2[Math.min(i + 2, points2.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d2 += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const centerX = (from.x + to.x) / 2;
  const centerY = (from.y + to.y) / 2;

  const headKind = s.head ?? "arrow";
  const tailKind = s.tail ?? "none";

  const renderDoodleMarker = (markerId: string, kind: string, isHead: boolean) => {
    if (kind === "none") return null;
    if (kind === "dot" || kind === "circle") {
      return (
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="3" fill={kind === "dot" ? color : "none"} stroke={color} strokeWidth={1.5} />
        </marker>
      );
    }
    // Hand-drawn arrow head with slight imperfection
    const r = seededRandom(seed + (isHead ? 13 : 29));
    const j = (v: number) => v + (r() - 0.5) * 1.5;
    if (kind === "diamond") {
      return (
        <marker id={markerId} markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d={`M ${j(1)} ${j(6)} L ${j(6)} ${j(1)} L ${j(11)} ${j(6)} L ${j(6)} ${j(11)} Z`} stroke={color} fill="none" strokeWidth={1.5} strokeLinejoin="round" />
        </marker>
      );
    }
    if (kind === "bar") {
      return (
        <marker id={markerId} markerWidth="4" markerHeight="12" refX="2" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d={`M ${j(2)} ${j(1)} L ${j(2)} ${j(11)}`} stroke={color} fill="none" strokeWidth={2} strokeLinecap="round" />
        </marker>
      );
    }
    if (kind === "triangle") {
      if (isHead) {
        return (
          <marker id={markerId} markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d={`M ${j(1)} ${j(1)} L ${j(10)} ${j(5)} L ${j(1)} ${j(9)} Z`} stroke={color} fill={color} strokeWidth={1} strokeLinejoin="round" />
          </marker>
        );
      }
      return (
        <marker id={markerId} markerWidth="12" markerHeight="10" refX="2" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d={`M ${j(11)} ${j(1)} L ${j(2)} ${j(5)} L ${j(11)} ${j(9)} Z`} stroke={color} fill={color} strokeWidth={1} strokeLinejoin="round" />
        </marker>
      );
    }
    // Default hand-drawn open arrow
    if (isHead) {
      return (
        <marker id={markerId} markerWidth="14" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d={`M ${j(1)} ${j(1)} L ${j(12)} ${j(6)} L ${j(1)} ${j(11)}`} stroke={color} fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      );
    }
    return (
      <marker id={markerId} markerWidth="14" markerHeight="12" refX="2" refY="6" orient="auto" markerUnits="strokeWidth">
        <path d={`M ${j(13)} ${j(1)} L ${j(2)} ${j(6)} L ${j(13)} ${j(11)}`} stroke={color} fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    );
  };

  return (
    <g style={{ pointerEvents: "auto", cursor: "pointer" }} onMouseDown={onMouseDown} transform={rot ? `rotate(${rot}, ${centerX}, ${centerY})` : undefined}>
      {/* Hit area */}
      <path d={d} stroke="transparent" strokeWidth={Math.max(sw + 14, 18)} fill="none" />
      {selected && <path d={d} stroke="var(--tg-primary, #6366f1)" strokeWidth={sw + 4} fill="none" strokeDasharray="6 3" />}
      <defs>
        {renderDoodleMarker(headMarkerId, headKind, true)}
        {renderDoodleMarker(tailMarkerId, tailKind, false)}
      </defs>
      {/* Second stroke for sketchy double-line */}
      <path
        d={d2}
        stroke={color}
        strokeWidth={sw * 0.7}
        fill="none"
        opacity={0.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main stroke */}
      <path
        d={d}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={headKind !== "none" ? `url(#${headMarkerId})` : undefined}
        markerStart={tailKind !== "none" ? `url(#${tailMarkerId})` : undefined}
      />

      {/* Draggable endpoints (visible when selected) */}
      {selected && (
        <>
          <circle
            cx={from.x}
            cy={from.y}
            r={6}
            fill="var(--tg-primary, #6366f1)"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointStart?.(e, ann.id, "from", from.x, from.y);
            }}
          />
          <circle
            cx={to.x}
            cy={to.y}
            r={6}
            fill="var(--tg-primary, #6366f1)"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: "move" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointStart?.(e, ann.id, "to", to.x, to.y);
            }}
          />
        </>
      )}
    </g>
  );
}
