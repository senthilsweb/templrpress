/**
 * API client for communicating with the Go backend.
 *
 * In dev mode (Next.js dev server on :3000), requests are proxied
 * via next.config.ts rewrites to http://localhost:9898.
 * In prod (static export embedded in Go binary), requests go to
 * the same origin that served the page.
 */

const getBaseUrl = (): string => {
  if (typeof window === "undefined") return "";
  return "";
};

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const { params, ...init } = options ?? {};
    const res = await fetch(this.buildUrl(path, params), {
      ...init,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const { params, ...init } = options ?? {};
    const res = await fetch(this.buildUrl(path, params), {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`POST ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async postRaw(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<Response> {
    const { params, ...init } = options ?? {};
    return fetch(this.buildUrl(path, params), {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const { params, ...init } = options ?? {};
    const res = await fetch(this.buildUrl(path, params), {
      ...init,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`PUT ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const { params, ...init } = options ?? {};
    const res = await fetch(this.buildUrl(path, params), {
      ...init,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`DELETE ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();
