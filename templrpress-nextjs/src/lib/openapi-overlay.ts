/**
 * Per-spec overlay for the OpenAPI viewer.
 *
 * Stored client-side in localStorage under `tg.openapi.overlay.<specName>`.
 * Never persisted server-side. See
 * openspec/changes/add-openapi-spec-overlay/design.md.
 */

export interface HeaderRow {
  name: string;
  value: string;
  /** default true */
  enabled?: boolean;
}

export interface SpecOverlay {
  baseUrlOverride?: string;
  globalHeaders: HeaderRow[];
  updatedAt?: string;
}

export const EMPTY_OVERLAY: SpecOverlay = { globalHeaders: [] };

const KEY_PREFIX = "tg.openapi.overlay.";

function safeKey(specName: string): string {
  return KEY_PREFIX + (specName || "_builtin");
}

export function loadOverlay(specName: string): SpecOverlay {
  if (typeof window === "undefined") return { ...EMPTY_OVERLAY };
  try {
    const raw = window.localStorage.getItem(safeKey(specName));
    if (!raw) return { ...EMPTY_OVERLAY };
    const parsed = JSON.parse(raw) as Partial<SpecOverlay>;
    return {
      baseUrlOverride:
        typeof parsed.baseUrlOverride === "string"
          ? parsed.baseUrlOverride
          : undefined,
      globalHeaders: Array.isArray(parsed.globalHeaders)
        ? parsed.globalHeaders
            .filter(
              (h): h is HeaderRow =>
                !!h && typeof h.name === "string" && typeof h.value === "string",
            )
            .map((h) => ({
              name: h.name,
              value: h.value,
              enabled: h.enabled !== false,
            }))
        : [],
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { ...EMPTY_OVERLAY };
  }
}

export function saveOverlay(specName: string, overlay: SpecOverlay): void {
  if (typeof window === "undefined") return;
  const next: SpecOverlay = {
    baseUrlOverride: overlay.baseUrlOverride?.trim() || undefined,
    globalHeaders: overlay.globalHeaders.map((h) => ({
      name: h.name.trim(),
      value: h.value,
      enabled: h.enabled !== false,
    })),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(safeKey(specName), JSON.stringify(next));
}

export function resetOverlay(specName: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(safeKey(specName));
}

export function isOverlayActive(overlay: SpecOverlay): boolean {
  if (overlay.baseUrlOverride && overlay.baseUrlOverride.trim()) return true;
  return overlay.globalHeaders.some(
    (h) => h.enabled !== false && h.name.trim() && h.value.trim(),
  );
}

export function overlayOverrideCount(overlay: SpecOverlay): number {
  let n = 0;
  if (overlay.baseUrlOverride && overlay.baseUrlOverride.trim()) n += 1;
  n += overlay.globalHeaders.filter(
    (h) => h.enabled !== false && h.name.trim() && h.value.trim(),
  ).length;
  return n;
}

/**
 * Parse an http(s) origin from a URL string. Returns null when malformed or
 * non-http(s).
 */
function originOf(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

export interface MergedRequest {
  url: string;
  headers: Record<string, string>;
  /** True when overlay headers were dropped due to the cross-origin guard. */
  headersDroppedForOrigin: boolean;
}

/**
 * Merge overlay base URL + global headers with the user-typed request fields.
 *
 * @param relativePath  the OpenAPI path (with {placeholders} resolved by caller)
 *                      OR an absolute URL (returned as-is for base URL).
 * @param specServerUrl the spec's primary server URL (servers[0].url), if any
 * @param userHeaders   headers typed by the user in the Try-It form (these win)
 * @param overlay       the active spec overlay
 */
export function mergeRequest(
  relativePath: string,
  specServerUrl: string | undefined,
  userHeaders: Record<string, string>,
  overlay: SpecOverlay,
): MergedRequest {
  // Pick effective base URL: overlay wins, else spec server, else "" (same origin).
  const overlayBase = overlay.baseUrlOverride?.trim();
  const base = overlayBase || specServerUrl || "";

  let url: string;
  if (/^https?:\/\//i.test(relativePath)) {
    url = relativePath;
  } else if (base) {
    url = base.replace(/\/+$/, "") + (relativePath.startsWith("/") ? "" : "/") + relativePath;
  } else {
    url = relativePath;
  }

  // Cross-origin guardrail.
  const finalOrigin = originOf(url);
  const allowedOrigins = new Set(
    [originOf(specServerUrl), originOf(overlayBase)].filter(
      (o): o is string => !!o,
    ),
  );
  // Same-origin (no scheme prefix) is always allowed.
  const isAbsolute = /^https?:\/\//i.test(url);
  const headersDroppedForOrigin =
    isAbsolute && finalOrigin !== null && allowedOrigins.size > 0 && !allowedOrigins.has(finalOrigin);

  const headers: Record<string, string> = {};
  if (!headersDroppedForOrigin) {
    for (const h of overlay.globalHeaders) {
      if (h.enabled === false) continue;
      const k = h.name.trim();
      const v = h.value;
      if (k && v) headers[k] = v;
    }
  }
  // User-typed headers always win.
  for (const [k, v] of Object.entries(userHeaders)) {
    if (k && v) headers[k] = v;
  }

  return { url, headers, headersDroppedForOrigin };
}
