"use client";

import React, { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  BrandingConfig,
  PostgresServer,
  OpenObserveServer,
  OpenSearchServer,
  MongoDBServer,
  MySQLServer,
  ServerConfigResponse,
} from "@/lib/config";

interface ConfigContextValue {
  branding: BrandingConfig | undefined;
  postgresServers: PostgresServer[];
  openobserveServers: OpenObserveServer[];
  opensearchServers: OpenSearchServer[];
  mongodbServers: MongoDBServer[];
  mysqlServers: MySQLServer[];
  isLoading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const serversQuery = useQuery({
    queryKey: ["config", "servers"],
    queryFn: () => api.get<ServerConfigResponse>("/api/config/servers"),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const brandingQuery = useQuery({
    queryKey: ["config", "branding"],
    queryFn: () => api.get<{ branding: BrandingConfig }>("/api/config/branding"),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const value: ConfigContextValue = {
    branding: brandingQuery.data?.branding,
    postgresServers: serversQuery.data?.postgres_servers ?? [],
    openobserveServers: serversQuery.data?.openobserve_servers ?? [],
    opensearchServers: serversQuery.data?.opensearch_servers ?? [],
    mongodbServers: serversQuery.data?.mongodb_servers ?? [],
    mysqlServers: serversQuery.data?.mysql_servers ?? [],
    isLoading: serversQuery.isLoading || brandingQuery.isLoading,
    error: serversQuery.error ?? brandingQuery.error ?? null,
  };

  const branding = value.branding;
  useEffect(() => {
    if (branding?.page_title) {
      document.title = branding.page_title;
    }
    if (branding?.page_description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", branding.page_description);
    }
    if (branding?.favicon_url) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.setAttribute("href", branding.favicon_url);
      if (branding.favicon_url.endsWith(".svg")) {
        link.setAttribute("type", "image/svg+xml");
      }
    }
  }, [branding?.page_title, branding?.page_description, branding?.favicon_url]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return ctx;
}
