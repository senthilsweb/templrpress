/* ── Code-Snapshot YAML Schema Types ─────────────────────────────── */

export interface SnapshotConfig {
  type?: string;
  title?: string;
  canvas: CanvasConfig;
  elements: SnapshotElement[];
  annotations: SnapshotAnnotation[];
  watermark?: WatermarkConfig;
  /** Unified back-to-front render order of element + annotation IDs */
  render_order?: string[];
}

export interface WatermarkConfig {
  enabled?: boolean;
  text?: string;
  opacity?: number;
  font_size?: number;
  color?: string;
  angle?: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  background: {
    type: "solid" | "gradient" | "radial";
    colors: string[];
    angle?: number;
  };
}

/* ── Elements ────────────────────────────────────────────────────── */

export interface BaseElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number | "auto" };
  window?: WindowConfig;
  group_id?: string;
  rotation?: number;
  border?: {
    style?: "solid" | "dashed" | "dotted";
    color?: string;
    width?: number;
  };
}

export interface CodeElement extends BaseElement {
  type: "code";
  code: {
    language: string;
    theme: string;
    content: string;
  };
}

export interface ImageElement extends BaseElement {
  type: "image";
  image: {
    src: string;
    fit?: "contain" | "cover" | "fill" | "none";
    border_radius?: number;
  };
}

export interface BarcodeElement extends BaseElement {
  type: "barcode";
  barcode: {
    content: string;
    show_text?: boolean;
    bar_color?: string;
    background?: string;
  };
}

export type SnapshotElement = CodeElement | ImageElement | BarcodeElement;

export interface WindowConfig {
  style: "macos" | "windows" | "plain" | "none";
  shadow?: boolean;
  border_radius?: number;
  opacity?: number;
}

/* ── Annotations ─────────────────────────────────────────────────── */

export interface BaseAnnotation {
  id: string;
  type: string;
  group_id?: string;
  rotation?: number;
}

export interface LabelAnnotation extends BaseAnnotation {
  type: "label";
  text: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style: {
    background?: string;
    color?: string;
    font_size?: number;
    font_weight?: string;
    font_family?: string;
    font_style?: string;
    text_decoration?: string;
    text_align?: "left" | "center" | "right";
    padding?: { x: number; y: number };
    border_radius?: number;
    border_style?: "solid" | "dashed" | "dotted";
    border_color?: string;
    border_width?: number;
  };
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  from: { x: number; y: number };
  to: { x: number; y: number };
  style: {
    color?: string;
    stroke_width?: number;
    curve?: "bezier" | "straight" | "step";
    head?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    tail?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    dash?: "solid" | "dashed" | "dotted";
  };
}

export interface CurvyArrowAnnotation extends BaseAnnotation {
  type: "curvy-arrow";
  from: { x: number; y: number };
  to: { x: number; y: number };
  control1?: { x: number; y: number };
  control2?: { x: number; y: number };
  style: {
    color?: string;
    stroke_width?: number;
    head?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    tail?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    dash?: "solid" | "dashed" | "dotted";
  };
}

export interface DoodleArrowAnnotation extends BaseAnnotation {
  type: "doodle-arrow";
  from: { x: number; y: number };
  to: { x: number; y: number };
  style: {
    color?: string;
    stroke_width?: number;
    head?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    tail?: "arrow" | "open-arrow" | "triangle" | "diamond" | "circle" | "bar" | "dot" | "none";
    seed?: number;
  };
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: "rectangle";
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    border_color?: string;
    border_width?: number;
    border_style?: "solid" | "dashed" | "dotted";
    fill?: string;
    border_radius?: number;
  };
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  target: string;
  lines: number[];
  style: {
    background?: string;
  };
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: "ellipse";
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    border_color?: string;
    border_width?: number;
    border_style?: "solid" | "dashed" | "dotted";
    fill?: string;
  };
}

export interface PolygonAnnotation extends BaseAnnotation {
  type: "polygon";
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    sides?: number;
    border_color?: string;
    border_width?: number;
    border_style?: "solid" | "dashed" | "dotted";
    fill?: string;
  };
}

export type SnapshotAnnotation =
  | LabelAnnotation
  | ArrowAnnotation
  | CurvyArrowAnnotation
  | DoodleArrowAnnotation
  | RectangleAnnotation
  | HighlightAnnotation
  | EllipseAnnotation
  | PolygonAnnotation;
