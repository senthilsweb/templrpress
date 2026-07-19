"use client";

import { Suspense, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Play,
  Search,
  Settings,
  X,
  Menu,
  FileJson,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APITester, type APITesterProps } from "@/components/rest-api/api-tester";
import { SpecSettingsSheet } from "@/components/rest-api/spec-settings-sheet";
import {
  EMPTY_OVERLAY,
  isOverlayActive,
  loadOverlay,
  overlayOverrideCount,
  type SpecOverlay,
} from "@/lib/openapi-overlay";

/* ================================================================== */
/*  OpenAPI Types                                                      */
/* ================================================================== */

interface OpenAPIInfo {
  title: string;
  description?: string;
  version: string;
}

interface OpenAPIParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: {
    type?: string;
    default?: unknown;
    enum?: string[];
    format?: string;
  };
  description?: string;
}

interface OpenAPISchemaObj {
  type?: string;
  properties?: Record<string, OpenAPISchemaObj>;
  items?: OpenAPISchemaObj;
  required?: string[];
  enum?: string[];
  description?: string;
  format?: string;
  default?: unknown;
  example?: unknown;
  $ref?: string;
}

interface OpenAPIMediaType {
  schema?: OpenAPISchemaObj;
  example?: unknown;
}

interface OpenAPIResponse {
  description?: string;
  content?: Record<string, OpenAPIMediaType>;
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, OpenAPIMediaType>;
  };
  responses?: Record<string, OpenAPIResponse>;
}

interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchemaObj>;
  };
}

interface EndpointEntry {
  method: string;
  path: string;
  operation: OpenAPIOperation;
  tag: string;
}

interface BodyField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enumValues?: string[];
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-500 text-white",
  post: "bg-blue-500 text-white",
  put: "bg-amber-500 text-white",
  delete: "bg-red-500 text-white",
  patch: "bg-purple-500 text-white",
};

/* ------------------------------------------------------------------ */
/*  Swagger 2.0 → OpenAPI 3.0 normalizer                              */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSpec(raw: any): OpenAPISpec {
  // Already OpenAPI 3.x — return as-is
  if (raw.openapi) return raw as OpenAPISpec;

  // Convert Swagger 2.0 → OpenAPI 3.0 structure
  const definitions = raw.definitions ?? {};
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: raw.info,
    paths: {},
    components: { schemas: definitions },
  };

  for (const [path, methods] of Object.entries(raw.paths ?? {})) {
    spec.paths[path] = {};
    for (const [method, rawOp] of Object.entries(methods as Record<string, unknown>)) {
      if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op = { ...(rawOp as any) } as OpenAPIOperation & { consumes?: string[]; produces?: string[] };

      // Convert parameters: move "in: body" → requestBody
      if (op.parameters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = op.parameters as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bodyParam = params.find((p: any) => p.in === "body");
        op.parameters = params
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((p: any) => p.in !== "body")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => ({ ...p, schema: p.schema ?? { type: p.type } }));
        if (bodyParam) {
          op.requestBody = {
            required: bodyParam.required ?? false,
            content: { "application/json": { schema: rewriteRef(bodyParam.schema ?? {}) } },
          };
        }
      }

      // Convert responses: schema → content
      if (op.responses) {
        for (const [code, resp] of Object.entries(op.responses)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = resp as any;
          if (r.schema && !r.content) {
            (op.responses as Record<string, OpenAPIResponse>)[code] = {
              description: r.description ?? "",
              content: { "application/json": { schema: rewriteRef(r.schema) } },
            };
          }
        }
      }

      delete (op as Record<string, unknown>).consumes;
      delete (op as Record<string, unknown>).produces;
      spec.paths[path][method] = op;
    }
  }

  return spec;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rewriteRef(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (typeof obj.$ref === "string") {
    return { ...obj, $ref: obj.$ref.replace("#/definitions/", "#/components/schemas/") };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Array.isArray(v) ? v.map(rewriteRef) : typeof v === "object" ? rewriteRef(v) : v;
  }
  return out;
}

const METHOD_TEXT: Record<string, string> = {
  get: "text-emerald-600",
  post: "text-blue-600",
  put: "text-amber-600",
  delete: "text-red-600",
  patch: "text-purple-600",
};

function resolveRef(spec: OpenAPISpec, ref: string): OpenAPISchemaObj {
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    current = (current as Record<string, unknown>)?.[part];
  }
  return (current as OpenAPISchemaObj) ?? {};
}

function deepResolve(
  schema: OpenAPISchemaObj,
  spec: OpenAPISpec,
  depth = 0,
): OpenAPISchemaObj {
  if (depth > 8) return schema;
  if (schema.$ref) return deepResolve(resolveRef(spec, schema.$ref), spec, depth + 1);
  if (schema.properties) {
    const props: Record<string, OpenAPISchemaObj> = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      props[k] = deepResolve(v, spec, depth + 1);
    }
    return { ...schema, properties: props };
  }
  if (schema.items) {
    return { ...schema, items: deepResolve(schema.items, spec, depth + 1) };
  }
  return schema;
}

function extractBodyFields(
  operation: OpenAPIOperation,
  spec: OpenAPISpec,
): BodyField[] {
  const content = operation.requestBody?.content?.["application/json"];
  if (!content?.schema) return [];
  const resolved = deepResolve(content.schema, spec);
  if (!resolved.properties) return [];
  const required = resolved.required ?? [];
  return Object.entries(resolved.properties).map(([name, prop]) => ({
    name,
    type: prop.type ?? "string",
    required: required.includes(name),
    description: prop.description,
    enumValues: prop.enum,
  }));
}

function generateExampleFromSchema(
  schema: OpenAPISchemaObj,
  spec: OpenAPISpec,
): unknown {
  const resolved = deepResolve(schema, spec);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.enum) return resolved.enum[0];
  switch (resolved.type) {
    case "string":
      return resolved.format === "date" ? "2025-01-01" : "string";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    case "array":
      return resolved.items
        ? [generateExampleFromSchema(resolved.items, spec)]
        : [];
    case "object":
      if (resolved.properties) {
        const obj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(resolved.properties)) {
          obj[k] = generateExampleFromSchema(v, spec);
        }
        return obj;
      }
      return {};
    default:
      return null;
  }
}

function generateCodeExamples(
  method: string,
  path: string,
  operation: OpenAPIOperation,
  spec: OpenAPISpec,
): { language: string; label: string; code: string }[] {
  const hasBody = ["post", "put", "patch"].includes(method);
  let bodyJson = "";
  if (hasBody && operation.requestBody?.content?.["application/json"]) {
    const media = operation.requestBody.content["application/json"];
    const example =
      media.example ??
      (media.schema ? generateExampleFromSchema(media.schema, spec) : null);
    if (example) bodyJson = JSON.stringify(example, null, 2);
  }

  const curl = [
    `curl -X ${method.toUpperCase()} '${path}'`,
    ...(hasBody && bodyJson
      ? [`  -H 'Content-Type: application/json'`, `  -d '${bodyJson}'`]
      : []),
  ].join(" \\\n");

  const fetchBody = hasBody && bodyJson
    ? `,\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify(${bodyJson})`
    : "";
  const js = `const res = await fetch("${path}", {\n    method: "${method.toUpperCase()}"${fetchBody}\n});\nconst data = await res.json();\nconsole.log(data);`;

  const pyBody = hasBody && bodyJson
    ? `\n    json=${bodyJson},`
    : "";
  const py = `import requests\n\nres = requests.${method}("${path}"${pyBody.replace(/\n/g, "\n    ")})\nprint(res.json())`;

  return [
    { language: "curl", label: "cURL", code: curl },
    { language: "javascript", label: "JavaScript", code: js },
    { language: "python", label: "Python", code: py },
  ];
}

/** Normalize swagger tag names to title case and merge similar tags */
function normalizeTag(tag: string): string {
  const ALIASES: Record<string, string> = {
    kvstore: "KV Store",
    "kv store": "KV Store",
    postgresql: "PostgreSQL",
    postgres: "PostgreSQL",
    "data catalog": "Data Catalog",
    imagerender: "Image Render",
    cms: "CMS",
    api: "Proxy",
  };
  const lower = tag.toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function groupEndpoints(spec: OpenAPISpec): Map<string, EndpointEntry[]> {
  const groups = new Map<string, EndpointEntry[]>();

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        const op = operation as OpenAPIOperation;
        // Use swagger tag if available, otherwise derive from path
        let tag = "General";
        if (op.tags && op.tags.length > 0) {
          tag = normalizeTag(op.tags[0]);
        } else {
          const segments = path.split("/").filter(Boolean);
          if (segments.length >= 2 && segments[0] === "api") {
            tag = normalizeTag(segments[1]);
          }
        }

        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push({
          method,
          path,
          operation: op,
          tag,
        });
      }
    }
  }
  return groups;
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function MarkdownDescription({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>,
          code: ({ children, className: cn }) => {
            if (cn?.includes("language-")) {
              return <code className="block font-mono text-[13px] leading-relaxed">{children}</code>;
            }
            return (
              <code className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-[var(--tg-primary)] underline hover:opacity-80" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-4 border-[var(--tg-primary)] bg-gray-50 py-2 pl-4 italic dark:bg-gray-800/50">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800/60">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ---- Simple syntax colorizer ------------------------------------ */

function colorizeCode(code: string, language: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    const push = (text: string, color: string) => {
      tokens.push(<span key={key++} className={color}>{text}</span>);
    };

    if (language === "curl") {
      // Colorize curl commands
      remaining = remaining.replace(/^(curl)\b/, (_, m) => { push(m, "text-emerald-400"); return ""; });
      remaining = remaining.replace(/(-X\s+)(GET|POST|PUT|DELETE|PATCH)/g, (_, flag, method) => {
        push(flag, "text-gray-400"); push(method, "text-amber-400"); return "";
      });
      remaining = remaining.replace(/(-[HhduX])\s+/g, (_, flag) => { push(flag + " ", "text-purple-400"); return ""; });
      remaining = remaining.replace(/'([^']*)'/g, (_, s) => { push("'" + s + "'", "text-sky-300"); return ""; });
      if (remaining) push(remaining, "text-slate-300");
    } else if (language === "javascript") {
      // Colorize JS
      const parts = remaining.split(/(const |let |var |await |async |new |return |throw |try |catch |if |else |\bfunction\b|=>|\.then|\.catch|console\.log|console\.error|fetch|JSON\.stringify|"[^"]*"|'[^']*'|\{|\}|\(|\)|;|,|\.\.\.|===|!==|&&|\|\|)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^(const |let |var |await |async |new |return |throw |try |catch |if |else )$/.test(part)) push(part, "text-purple-400");
        else if (/^(=>|\.then|\.catch|function)$/.test(part)) push(part, "text-purple-400");
        else if (/^(fetch|JSON\.stringify|console\.log|console\.error)$/.test(part)) push(part, "text-emerald-400");
        else if (/^["']/.test(part)) push(part, "text-amber-300");
        else push(part, "text-slate-300");
      }
    } else if (language === "python") {
      // Colorize Python
      const parts = remaining.split(/(import |from |as |def |class |return |if |else |elif |for |in |with |print|requests\.\w+|\b(True|False|None)\b|"[^"]*"|'[^']*'|#.*$)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^(import |from |as |def |class |return |if |else |elif |for |in |with )$/.test(part)) push(part, "text-purple-400");
        else if (/^(True|False|None)$/.test(part)) push(part, "text-amber-400");
        else if (/^requests\.\w+$/.test(part)) push(part, "text-emerald-400");
        else if (/^print$/.test(part)) push(part, "text-emerald-400");
        else if (/^["']/.test(part)) push(part, "text-amber-300");
        else if (/^#/.test(part)) push(part, "text-gray-500");
        else push(part, "text-slate-300");
      }
    } else {
      push(remaining, "text-slate-300");
    }

    return <div key={i}>{tokens.length > 0 ? tokens : "\n"}</div>;
  });
}

/* ---- Code panel (fixed right) ----------------------------------- */

function CodePanel({
  method,
  path,
  operation,
  spec,
  onTryIt,
}: {
  method: string;
  path: string;
  operation: OpenAPIOperation;
  spec: OpenAPISpec;
  onTryIt: () => void;
}) {
  const examples = useMemo(
    () => generateCodeExamples(method, path, operation, spec),
    [method, path, operation, spec],
  );
  const [tab, setTab] = useState("curl");
  const currentExample = examples.find((e) => e.language === tab) ?? examples[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Code Examples</h3>
        <button
          onClick={onTryIt}
          className="flex items-center gap-1.5 rounded-md bg-[var(--tg-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
        >
          <Play className="h-3 w-3" />
          Try It
        </button>
      </div>

      {/* Language tabs */}
      <div className="flex gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex.language}
            onClick={() => setTab(ex.language)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === ex.language
                ? "bg-[var(--tg-primary)] text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Code card */}
      <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-md">
        <div className="flex items-center border-b border-zinc-700 bg-zinc-800 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {currentExample.label}
          </span>
          <div className="ml-auto">
            <CopyButton text={currentExample.code} />
          </div>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
          {colorizeCode(currentExample.code, currentExample.language)}
        </pre>
      </div>
    </div>
  );
}

/* ---- Endpoint detail (center) ----------------------------------- */

function EndpointDetail({
  entry,
  spec,
  overrideBadge,
}: {
  entry: EndpointEntry;
  spec: OpenAPISpec;
  overrideBadge?: React.ReactNode;
}) {
  const { method, path, operation } = entry;
  const params = operation.parameters ?? [];
  const bodyFields = extractBodyFields(operation, spec);
  const responses = operation.responses ?? {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              METHOD_COLORS[method] ?? "bg-gray-500 text-white"
            }`}
          >
            {method}
          </span>
          <code className="text-sm font-mono font-medium">{path}</code>
          {overrideBadge}
        </div>
        <h2 className="text-lg font-semibold">
          {operation.summary ?? `${method.toUpperCase()} ${path}`}
        </h2>
        {operation.description && (
          <MarkdownDescription content={operation.description} />
        )}
      </div>

      {/* Parameters */}
      {params.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Parameters</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    In
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {params.map((p) => (
                  <tr key={`${p.in}-${p.name}`}>
                    <td className="px-3 py-2 font-mono text-xs">
                      {p.name}
                      {p.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {p.in}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {p.schema?.type ?? "string"}
                      {p.schema?.enum && (
                        <span className="ml-1 text-gray-400">
                          [{p.schema.enum.join(", ")}]
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {p.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request body fields */}
      {bodyFields.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Request Body</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Field
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bodyFields.map((f) => (
                  <tr key={f.name}>
                    <td className="px-3 py-2 font-mono text-xs">
                      {f.name}
                      {f.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {f.type}
                      {f.enumValues && (
                        <span className="ml-1 text-gray-400">
                          [{f.enumValues.join(", ")}]
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {f.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responses */}
      {Object.keys(responses).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Responses</h3>
          <div className="space-y-2">
            {Object.entries(responses).map(([code, resp]) => {
              const r = resp as OpenAPIResponse;
              return (
                <div
                  key={code}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge
                    variant={code.startsWith("2") ? "default" : "destructive"}
                    className="text-[10px] shrink-0"
                  >
                    {code}
                  </Badge>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {r.description ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Page                                                          */
/* ================================================================== */

export default function RestApiSpecPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <RestApiSpecPageInner />
    </Suspense>
  );
}

function RestApiSpecPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSpec = searchParams.get("spec") ?? "";

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [testerOpen, setTesterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overlay, setOverlay] = useState<SpecOverlay>(EMPTY_OVERLAY);
  const mainRef = useRef<HTMLDivElement>(null);

  /* Fetch registered OpenAPI specs (multi-spec dropdown) */
  type SpecEntry = {
    name: string;
    url: string;
    is_default?: boolean;
    description?: string;
  };
  const { data: specList } = useQuery<{ items: SpecEntry[]; total: number }>({
    queryKey: ["openapi-spec-list"],
    queryFn: async () => {
      const res = await fetch("/api/config/openapi-specs");
      if (!res.ok) throw new Error("Failed to load spec list");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  /* Resolve which spec is active: URL param → default → first → _builtin. */
  const activeSpecName = useMemo(() => {
    const items = specList?.items ?? [];
    if (urlSpec && items.some((s) => s.name === urlSpec)) return urlSpec;
    const def = items.find((s) => s.is_default);
    if (def) return def.name;
    const firstUser = items.find((s) => s.name !== "_builtin");
    if (firstUser) return firstUser.name;
    return "_builtin";
  }, [specList, urlSpec]);

  const handleSpecChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      // Always set ?spec= explicitly (including _builtin) so an explicit user
      // selection wins over a configured is_default entry on the next render.
      params.set("spec", next);
      router.replace(`?${params.toString()}`, { scroll: false });
      setSelectedEndpoint(null);
      setExpandedTags(new Set());
    },
    [router, searchParams],
  );

  /* Fetch OpenAPI spec for the active selection */
  const { data: spec, isLoading, error, refetch } = useQuery<OpenAPISpec>({
    queryKey: ["openapi-spec", activeSpecName],
    queryFn: async () => {
      const url =
        activeSpecName && activeSpecName !== "_builtin"
          ? `/api/openapi-spec?spec=${encodeURIComponent(activeSpecName)}`
          : "/api/openapi-spec";
      const res = await fetch(url);
      if (!res.ok) {
        let reason = "";
        try {
          const body = await res.json();
          reason = body?.reason || body?.error || "";
        } catch {
          /* ignore */
        }
        throw new Error(
          reason ? `Failed to load spec (${reason})` : "Failed to load spec",
        );
      }
      const raw = await res.json();
      return normalizeSpec(raw);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  /* Group endpoints */
  const groups = useMemo(() => (spec ? groupEndpoints(spec) : new Map()), [spec]);

  /* Filter by search */
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    const filtered = new Map<string, EndpointEntry[]>();
    for (const [tag, entries] of groups) {
      const matching = entries.filter(
        (e: EndpointEntry) =>
          e.path.toLowerCase().includes(q) ||
          (e.operation.summary ?? "").toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q),
      );
      if (matching.length > 0) filtered.set(tag, matching);
    }
    return filtered;
  }, [groups, searchQuery]);

  /* Total count */
  const totalEndpoints = useMemo(() => {
    let count = 0;
    for (const entries of groups.values()) count += entries.length;
    return count;
  }, [groups]);

  /* Auto-select first endpoint */
  useEffect(() => {
    if (!selectedEndpoint && groups.size > 0) {
      const first = groups.values().next().value;
      if (first && first.length > 0) setSelectedEndpoint(first[0]);
    }
  }, [groups, selectedEndpoint]);

  /* Reload overlay whenever the active spec changes (or after Save/Reset). */
  const reloadOverlay = useCallback(() => {
    setOverlay(loadOverlay(activeSpecName));
  }, [activeSpecName]);
  useEffect(() => {
    reloadOverlay();
  }, [reloadOverlay]);

  const overlayActive = isOverlayActive(overlay);
  const overrideCount = overlayOverrideCount(overlay);
  const specServerUrl =
    (spec as { servers?: Array<{ url?: string }> })?.servers?.[0]?.url ?? "";
  const activeSpecEntry = specList?.items.find((s) => s.name === activeSpecName);
  const activeSpecDescription = activeSpecEntry?.description?.trim() ?? "";
  const activeSpecDisplayName =
    activeSpecName === "_builtin" ? "templrpress" : activeSpecName;
  const activeSpecLabel = activeSpecDescription || activeSpecDisplayName;

  const overrideBadge = overlayActive ? (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex"
          >
            <Badge
              variant="outline"
              className="cursor-pointer border-[var(--tg-primary)] text-[var(--tg-primary)] text-[10px]"
            >
              Overrides · {overrideCount}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {overlay.baseUrlOverride ? `Base URL: ${overlay.baseUrlOverride}` : "Spec base URL"}
          <br />
          {overlay.globalHeaders.filter((h) => h.enabled !== false && h.name && h.value).length}{" "}
          global header(s)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  /* Toggle tag */
  const toggleTag = useCallback(
    (tag: string) =>
      setExpandedTags((prev) => {
        const next = new Set(prev);
        next.has(tag) ? next.delete(tag) : next.add(tag);
        return next;
      }),
    [],
  );

  /* Body fields for tester */
  const bodyFields = useMemo(
    () => (selectedEndpoint && spec ? extractBodyFields(selectedEndpoint.operation, spec) : []),
    [selectedEndpoint, spec],
  );

  /* Loading / error states */
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--tg-primary)]" />
          <p className="text-sm text-gray-500">Loading API spec…</p>
        </div>
      </div>
    );
  }

  if (error || !spec) {
    const hasOptions = (specList?.items?.length ?? 0) > 1;
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="max-w-md text-center">
          <FileJson className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            Could not load the OpenAPI spec
            {activeSpecName && activeSpecName !== "_builtin"
              ? ` "${activeSpecName}"`
              : ""}
            .
          </p>
          {error instanceof Error && (
            <p className="mt-1 text-xs text-gray-500">{error.message}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-md bg-[var(--tg-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--tg-primary)]/90"
            >
              Retry
            </button>
            {hasOptions && (
              <button
                onClick={() => handleSpecChange("_builtin")}
                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Switch to built-in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-white dark:bg-gray-950">
      {/* ---- Sidebar ---- */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } flex-shrink-0 border-r transition-all duration-200 overflow-hidden`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="mb-2">
              <h1 className="text-sm font-bold">{spec.info.title}</h1>
            </div>
            {(specList?.items?.length ?? 0) > 1 && (
              <div className="mb-2 flex items-center gap-1 w-full min-w-0">
                <Select value={activeSpecName} onValueChange={handleSpecChange}>
                  <SelectTrigger className="h-8 flex-1 min-w-0 w-0 text-xs">
                    <SelectValue>{activeSpecDisplayName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {specList!.items.map((s) => {
                      const displayName = s.name === "_builtin" ? "templrpress" : s.name;
                      return (
                      <SelectItem key={s.name} value={s.name} className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{displayName}</span>
                          {s.description?.trim() && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {s.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Spec settings"
                  title="Spec settings"
                >
                  <Settings
                    className={`h-4 w-4 ${overlayActive ? "text-[var(--tg-primary)]" : ""}`}
                  />
                </Button>
              </div>
            )}
            {(specList?.items?.length ?? 0) <= 1 && (
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Spec settings"
                  title="Spec settings"
                >
                  <Settings
                    className={`h-4 w-4 ${overlayActive ? "text-[var(--tg-primary)]" : ""}`}
                  />
                </Button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${totalEndpoints} endpoints…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-8 text-xs dark:border-gray-700 dark:bg-gray-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Endpoint list */}
          <div className="flex-1 overflow-y-auto">
            {Array.from(filteredGroups.entries()).map(([tag, entries]) => (
              <div key={tag}>
                <button
                  onClick={() => toggleTag(tag)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {expandedTags.has(tag) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {tag}
                  <span className="ml-auto text-gray-300 font-normal">
                    {entries.length}
                  </span>
                </button>
                {expandedTags.has(tag) && (
                  <div className="pb-1">
                    {entries.map((entry: EndpointEntry, idx: number) => {
                      const isActive =
                        selectedEndpoint?.method === entry.method &&
                        selectedEndpoint?.path === entry.path;
                      return (
                        <button
                          key={`${entry.method}-${entry.path}-${idx}`}
                          onClick={() => {
                            setSelectedEndpoint(entry);
                            mainRef.current?.scrollTo(0, 0);
                          }}
                          className={`flex w-full items-center gap-2 px-4 py-1.5 text-left text-xs transition-colors ${
                            isActive
                              ? "bg-[var(--tg-primary)]/10 border-r-2 border-[var(--tg-primary)]"
                              : "hover:bg-gray-50 dark:hover:bg-gray-900"
                          }`}
                        >
                          <span
                            className={`w-12 shrink-0 text-[9px] font-bold uppercase ${
                              METHOD_TEXT[entry.method] ?? "text-gray-500"
                            }`}
                          >
                            {entry.method}
                          </span>
                          <span className="truncate font-mono text-gray-700 dark:text-gray-300">
                            {entry.path}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ---- Main content ---- */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto min-w-0"
      >
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-white/90 backdrop-blur px-4 py-2 dark:bg-gray-950/90">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-4 w-4" />
          </button>
          {activeSpecDescription && (
            <span
              className="truncate text-xs text-gray-500 dark:text-gray-400"
              title={activeSpecDescription}
            >
              {activeSpecDescription}
            </span>
          )}
        </div>

        {selectedEndpoint ? (
          <div className="flex items-stretch min-h-[calc(100vh-97px)]">
            {/* Endpoint detail */}
            <div className="flex-1 min-w-0 p-6 lg:p-8 max-w-4xl xl:max-w-5xl">
              <EndpointDetail entry={selectedEndpoint} spec={spec} overrideBadge={overrideBadge} />
            </div>

            {/* Code panel - right side, hidden on small screens.
                The border lives on this stretched wrapper (not the sticky
                scroller) so the divider always spans the full row height. */}
            <div className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 border-l">
              <div className="sticky top-12 max-h-[calc(100vh-56px-48px)] overflow-y-auto p-5">
                <CodePanel
                  method={selectedEndpoint.method}
                  path={selectedEndpoint.path}
                  operation={selectedEndpoint.operation}
                  spec={spec}
                  onTryIt={() => setTesterOpen(true)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>Select an endpoint from the sidebar.</p>
          </div>
        )}

        {/* Mobile Try It button */}
        {selectedEndpoint && (
          <div className="lg:hidden fixed bottom-4 right-4 z-20">
            <button
              onClick={() => setTesterOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[var(--tg-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90"
            >
              <Play className="h-4 w-4" />
              Try It
            </button>
          </div>
        )}
      </main>

      {/* ---- API Tester Sheet ---- */}
      {selectedEndpoint && (
        <APITester
          open={testerOpen}
          onOpenChange={setTesterOpen}
          method={selectedEndpoint.method.toUpperCase()}
          path={selectedEndpoint.path}
          operation={selectedEndpoint.operation as APITesterProps["operation"]}
          bodyFields={bodyFields}
          specServerUrl={specServerUrl}
          overlayBaseUrl={overlay.baseUrlOverride}
          overlayHeaders={overlay.globalHeaders}
        />
      )}

      {/* ---- Spec Settings Sheet ---- */}
      <SpecSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        specName={activeSpecName}
        specLabel={activeSpecLabel}
        specServerUrl={specServerUrl}
        onChanged={reloadOverlay}
      />
    </div>
  );
}
