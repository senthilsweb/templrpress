"use client";

import { useMemo } from "react";
import hljs from "highlight.js";
import { cn } from "@/lib/utils";
import type { CodeElement } from "./snapshot-types";

/* ── macOS window dots ──────────────────────────────────────────── */

function MacOSDots() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

/* ── Windows title bar ──────────────────────────────────────────── */

function WindowsTitleBar() {
  return (
    <div className="flex items-center justify-end gap-2 bg-[#2d2d2d] px-3 py-2 text-xs text-gray-400">
      <span className="cursor-default">&#x2500;</span>
      <span className="cursor-default">&#x25FB;</span>
      <span className="cursor-default">&#x2715;</span>
    </div>
  );
}

/* ── Theme colors ───────────────────────────────────────────────── */

const THEME_BACKGROUNDS: Record<string, string> = {
  "one-dark": "#282c34",
  github: "#ffffff",
  dracula: "#282a36",
  monokai: "#272822",
  nord: "#2e3440",
};

const THEME_TEXT_COLORS: Record<string, string> = {
  "one-dark": "#abb2bf",
  github: "#24292e",
  dracula: "#f8f8f2",
  monokai: "#f8f8f2",
  nord: "#d8dee9",
};

/* ── Inline theme styles for highlight.js tokens ────────────────── */

const THEME_TOKEN_STYLES: Record<string, Record<string, string>> = {
  "one-dark": {
    "hljs-keyword": "#c678dd",
    "hljs-string": "#98c379",
    "hljs-number": "#d19a66",
    "hljs-comment": "#5c6370",
    "hljs-function": "#61afef",
    "hljs-title": "#61afef",
    "hljs-built_in": "#e6c07b",
    "hljs-type": "#e6c07b",
    "hljs-literal": "#d19a66",
    "hljs-params": "#abb2bf",
    "hljs-attr": "#d19a66",
    "hljs-variable": "#e06c75",
    "hljs-meta": "#e06c75",
    "hljs-punctuation": "#abb2bf",
    "hljs-property": "#e06c75",
    "hljs-operator": "#56b6c2",
    "hljs-tag": "#e06c75",
    "hljs-name": "#e06c75",
    "hljs-attribute": "#d19a66",
    "hljs-selector-class": "#e6c07b",
  },
  github: {
    "hljs-keyword": "#d73a49",
    "hljs-string": "#032f62",
    "hljs-number": "#005cc5",
    "hljs-comment": "#6a737d",
    "hljs-function": "#6f42c1",
    "hljs-title": "#6f42c1",
    "hljs-built_in": "#005cc5",
    "hljs-type": "#005cc5",
    "hljs-literal": "#005cc5",
    "hljs-params": "#24292e",
    "hljs-attr": "#005cc5",
    "hljs-variable": "#e36209",
    "hljs-meta": "#735c0f",
    "hljs-punctuation": "#24292e",
    "hljs-property": "#005cc5",
    "hljs-operator": "#d73a49",
    "hljs-tag": "#22863a",
    "hljs-name": "#22863a",
    "hljs-attribute": "#6f42c1",
    "hljs-selector-class": "#6f42c1",
  },
  dracula: {
    "hljs-keyword": "#ff79c6",
    "hljs-string": "#f1fa8c",
    "hljs-number": "#bd93f9",
    "hljs-comment": "#6272a4",
    "hljs-function": "#50fa7b",
    "hljs-title": "#50fa7b",
    "hljs-built_in": "#8be9fd",
    "hljs-type": "#8be9fd",
    "hljs-literal": "#bd93f9",
    "hljs-params": "#ffb86c",
    "hljs-attr": "#50fa7b",
    "hljs-variable": "#f8f8f2",
    "hljs-meta": "#ff79c6",
    "hljs-punctuation": "#f8f8f2",
    "hljs-property": "#66d9ef",
    "hljs-operator": "#ff79c6",
    "hljs-tag": "#ff79c6",
    "hljs-name": "#ff79c6",
    "hljs-attribute": "#50fa7b",
    "hljs-selector-class": "#50fa7b",
  },
  monokai: {
    "hljs-keyword": "#f92672",
    "hljs-string": "#e6db74",
    "hljs-number": "#ae81ff",
    "hljs-comment": "#75715e",
    "hljs-function": "#a6e22e",
    "hljs-title": "#a6e22e",
    "hljs-built_in": "#66d9ef",
    "hljs-type": "#66d9ef",
    "hljs-literal": "#ae81ff",
    "hljs-params": "#fd971f",
    "hljs-attr": "#a6e22e",
    "hljs-variable": "#f8f8f2",
    "hljs-meta": "#f92672",
    "hljs-punctuation": "#f8f8f2",
    "hljs-property": "#66d9ef",
    "hljs-operator": "#f92672",
    "hljs-tag": "#f92672",
    "hljs-name": "#f92672",
    "hljs-attribute": "#a6e22e",
    "hljs-selector-class": "#a6e22e",
  },
  nord: {
    "hljs-keyword": "#81a1c1",
    "hljs-string": "#a3be8c",
    "hljs-number": "#b48ead",
    "hljs-comment": "#616e88",
    "hljs-function": "#88c0d0",
    "hljs-title": "#88c0d0",
    "hljs-built_in": "#8fbcbb",
    "hljs-type": "#8fbcbb",
    "hljs-literal": "#b48ead",
    "hljs-params": "#d8dee9",
    "hljs-attr": "#8fbcbb",
    "hljs-variable": "#d8dee9",
    "hljs-meta": "#5e81ac",
    "hljs-punctuation": "#eceff4",
    "hljs-property": "#8fbcbb",
    "hljs-operator": "#81a1c1",
    "hljs-tag": "#81a1c1",
    "hljs-name": "#81a1c1",
    "hljs-attribute": "#8fbcbb",
    "hljs-selector-class": "#8fbcbb",
  },
};

/** Build a <style> block that scopes hljs classes to a generated id */
function buildThemeCSS(scopeId: string, theme: string): string {
  const tokens = THEME_TOKEN_STYLES[theme] ?? THEME_TOKEN_STYLES["one-dark"];
  return Object.entries(tokens)
    .map(([cls, color]) => `#${scopeId} .${cls} { color: ${color}; }`)
    .join("\n");
}

/* ── Component ──────────────────────────────────────────────────── */

interface Props {
  element: CodeElement;
}

export function SnapshotCodeBlock({ element }: Props) {
  const { code, window: win, size } = element;
  const theme = code.theme ?? "one-dark";
  const bg = THEME_BACKGROUNDS[theme] ?? THEME_BACKGROUNDS["one-dark"];
  const fg = THEME_TEXT_COLORS[theme] ?? THEME_TEXT_COLORS["one-dark"];
  const radius = win?.border_radius ?? 12;
  const opacity = win?.opacity ?? 1;
  const hasShadow = win?.shadow !== false;
  const windowStyle = win?.style ?? "macos";

  const scopeId = `hljs-${element.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const highlighted = useMemo(() => {
    try {
      const lang = code.language || "plaintext";
      const result = hljs.getLanguage(lang)
        ? hljs.highlight(code.content, { language: lang })
        : hljs.highlightAuto(code.content);
      return result.value;
    } catch {
      return code.content;
    }
  }, [code.content, code.language]);

  const themeCSS = useMemo(() => buildThemeCSS(scopeId, theme), [scopeId, theme]);

  return (
    <div
      id={scopeId}
      style={{
        width: size.width,
        height: size.height === "auto" ? undefined : size.height,
        borderRadius: radius,
        opacity,
        background: bg,
        color: fg,
      }}
      className={cn(
        "overflow-hidden",
        hasShadow && "shadow-2xl"
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* Window chrome */}
      {windowStyle === "macos" && <MacOSDots />}
      {windowStyle === "windows" && <WindowsTitleBar />}
      {windowStyle === "plain" && <div className="h-3" />}

      {/* Code content */}
      <pre
        className="overflow-auto px-5 pb-5 text-sm leading-relaxed"
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          tabSize: 2,
          paddingTop: windowStyle === "none" ? 20 : 4,
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
