"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Copy, Play, X, ChevronDown, ChevronUp } from "lucide-react";
import { mergeRequest } from "@/lib/openapi-overlay";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OpenAPIParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: { type?: string; default?: unknown; enum?: string[] };
  description?: string;
}

interface BodyField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enumValues?: string[];
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: Record<string, unknown> }>;
  };
  responses?: Record<string, unknown>;
}

export interface APITesterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: string;
  path: string;
  operation: OpenAPIOperation;
  bodyFields?: BodyField[];
  /** servers[0].url declared by the spec, if any. */
  specServerUrl?: string;
  /** Active overlay base URL (overrides specServerUrl). */
  overlayBaseUrl?: string;
  /** Active overlay global headers. */
  overlayHeaders?: { name: string; value: string; enabled?: boolean }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500",
  POST: "bg-blue-500",
  PUT: "bg-amber-500",
  DELETE: "bg-red-500",
  PATCH: "bg-purple-500",
};

function buildUrl(
  path: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
): string {
  let url = path;
  for (const [k, v] of Object.entries(pathParams)) {
    if (v) url = url.replace(`{${k}}`, encodeURIComponent(v));
  }
  const qs = Object.entries(queryParams)
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function APITester({
  open,
  onOpenChange,
  method,
  path,
  operation,
  bodyFields = [],
  specServerUrl,
  overlayBaseUrl,
  overlayHeaders = [],
}: APITesterProps) {
  const params = operation.parameters ?? [];
  const pathParams = params.filter((p) => p.in === "path");
  const queryParams = params.filter((p) => p.in === "query");
  const headerParams = params.filter((p) => p.in === "header");

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);

  /* State */
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState(() => {
    if (!hasBody || !operation.requestBody?.content) return "";
    const jsonContent = operation.requestBody.content["application/json"];
    if (jsonContent?.schema) {
      const example =
        (jsonContent as Record<string, unknown>).example ??
        (jsonContent.schema as Record<string, unknown>).example;
      if (example) return JSON.stringify(example, null, 2);
    }
    return "{}";
  });

  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* Compute the effective (merged) request — used both by execute() and for
   * the "Effective request" preview accordion. */
  const effective = useMemo(() => {
    const relative = buildUrl(path, pathValues, queryValues);
    const userHdr: Record<string, string> = {};
    for (const [k, v] of Object.entries(headerValues)) if (v) userHdr[k] = v;
    if (hasBody) userHdr["Content-Type"] = "application/json";
    return mergeRequest(
      relative,
      specServerUrl,
      userHdr,
      { baseUrlOverride: overlayBaseUrl, globalHeaders: overlayHeaders },
    );
  }, [path, pathValues, queryValues, headerValues, hasBody, specServerUrl, overlayBaseUrl, overlayHeaders]);

  /* Execute */
  const execute = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setResponse(null);

    const start = performance.now();
    try {
      const res = await fetch(effective.url, {
        method,
        headers: effective.headers,
        body: hasBody && bodyText ? bodyText : undefined,
        signal: ctrl.signal,
      });

      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => (resHeaders[k] = v));

      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: formatted,
        duration: elapsed,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResponse({
          status: 0,
          statusText: "Network Error",
          headers: {},
          body: (err as Error).message,
          duration: Math.round(performance.now() - start),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [method, effective, hasBody, bodyText]);

  /* Copy response */
  const copyResponse = useCallback(() => {
    if (response?.body)
      navigator.clipboard.writeText(response.body);
  }, [response]);

  /* Param row renderer */
  const renderParamRow = (
    p: OpenAPIParameter,
    values: Record<string, string>,
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  ) => (
    <div key={p.name} className="flex items-center gap-2">
      <label className="w-28 shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">
        {p.name}
        {p.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {p.schema?.enum ? (
        <select
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
          value={values[p.name] ?? ""}
          onChange={(e) =>
            setter((prev) => ({ ...prev, [p.name]: e.target.value }))
          }
        >
          <option value="">—</option>
          {p.schema.enum.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder={p.description ?? p.schema?.type ?? ""}
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
          value={values[p.name] ?? ""}
          onChange={(e) =>
            setter((prev) => ({ ...prev, [p.name]: e.target.value }))
          }
        />
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto"
        showCloseButton={false}
      >
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                  METHOD_COLORS[method] ?? "bg-gray-500"
                }`}
              >
                {method}
              </span>
              <span className="font-mono text-xs">{path}</span>
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {operation.summary && (
            <p className="text-xs text-gray-500 mt-1">{operation.summary}</p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          {/* Path parameters */}
          {pathParams.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Path Parameters
              </h4>
              <div className="flex flex-col gap-2">
                {pathParams.map((p) =>
                  renderParamRow(p, pathValues, setPathValues),
                )}
              </div>
            </section>
          )}

          {/* Query parameters */}
          {queryParams.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Query Parameters
              </h4>
              <div className="flex flex-col gap-2">
                {queryParams.map((p) =>
                  renderParamRow(p, queryValues, setQueryValues),
                )}
              </div>
            </section>
          )}

          {/* Header parameters */}
          {headerParams.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Headers
              </h4>
              <div className="flex flex-col gap-2">
                {headerParams.map((p) =>
                  renderParamRow(p, headerValues, setHeaderValues),
                )}
              </div>
            </section>
          )}

          {/* Request body */}
          {hasBody && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Request Body
              </h4>
              {bodyFields.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {bodyFields.map((f) => (
                    <Badge
                      key={f.name}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {f.name}
                      {f.required && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                      <span className="text-gray-400 ml-1">{f.type}</span>
                    </Badge>
                  ))}
                </div>
              )}
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                spellCheck={false}
                className="w-full h-40 rounded border border-border bg-background p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--tg-primary)]/40"
              />
            </section>
          )}

          {/* Effective request preview */}
          <details className="rounded border bg-muted/30 text-xs">
            <summary className="cursor-pointer select-none px-3 py-2 font-medium">
              Effective request
              {(overlayBaseUrl || overlayHeaders.some((h) => h.enabled !== false && h.name && h.value)) && (
                <Badge variant="outline" className="ml-2 text-[10px]">overlay</Badge>
              )}
              {effective.headersDroppedForOrigin && (
                <Badge variant="destructive" className="ml-2 text-[10px]">overlay headers dropped (cross-origin)</Badge>
              )}
            </summary>
            <div className="space-y-2 px-3 pb-3 pt-1 font-mono">
              <div>
                <span className="text-muted-foreground">URL: </span>
                <span className="break-all">{effective.url}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Headers:</span>
                {Object.keys(effective.headers).length === 0 ? (
                  <span className="ml-2 italic text-muted-foreground">none</span>
                ) : (
                  <ul className="ml-3 mt-1 list-disc space-y-0.5">
                    {Object.entries(effective.headers).map(([k, v]) => (
                      <li key={k}>
                        <span>{k}</span>: <span className="break-all">{k.toLowerCase().includes("auth") || k.toLowerCase().includes("token") || k.toLowerCase().includes("key") ? "••••••••" : v}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </details>

          {/* Execute button */}
          <button
            onClick={execute}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--tg-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Play className="h-3.5 w-3.5" />
            {loading ? "Sending…" : "Send Request"}
          </button>

          {/* Response */}
          {response && (
            <section className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={response.status < 400 ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {response.status} {response.statusText}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {response.duration}ms
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowHeaders(!showHeaders)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Headers
                    {showHeaders ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={copyResponse}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {showHeaders && (
                <div className="mb-2 rounded-md bg-gray-50 p-2 dark:bg-gray-800/50">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="text-[10px] font-mono">
                      <span className="text-gray-500">{k}:</span> {v}
                    </div>
                  ))}
                </div>
              )}

              <pre className="max-h-96 overflow-auto rounded-md bg-gray-950 p-3 text-xs text-emerald-300 font-mono">
                {response.body}
              </pre>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
