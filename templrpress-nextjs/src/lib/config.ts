/**
 * TypeScript types matching the Go config structs.
 * These mirror the JSON response from /api/config/servers.
 */

export interface NavColumn {
  title: string;
  children: NavItem[];
}

/**
 * Optional full-bleed footer band rendered at the bottom of a flyout.
 * Uses the active theme color (`var(--tg-primary)`) as background.
 */
export interface NavFooter {
  title: string;
  subtitle?: string;
  url?: string;
}

export interface NavItem {
  label: string;
  url: string;
  icon: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  enabled?: boolean;
  children?: NavItem[];
  /**
   * Optional two-column flyout layout. When present, the desktop renderer
   * displays each column side-by-side with its `title` as a heading, instead
   * of rendering the flat `children` list. `children` may also be omitted
   * when `columns` is supplied.
   */
  columns?: NavColumn[];
  /**
   * Optional full-bleed footer panel rendered below `children`/`columns`.
   * Themed with the active primary color.
   */
  footer?: NavFooter;
}

export interface ServiceEndpoint {
  name: string;
  endpoint: string;
  category: string;
  description: string;
  credentials?: { login: string; password: string }[];
  openapi_spec_path?: string;
  auth_type?: string;
  auth_config?: Record<string, string>;
}

/**
 * Recursively filter out NavItems with enabled === false.
 * Recurses through both `children` and `columns[*].children`.
 */
export function filterEnabledNavItems(items: NavItem[]): NavItem[] {
  return items
    .filter((item) => item.enabled !== false)
    .map((item) => ({
      ...item,
      children: item.children ? filterEnabledNavItems(item.children) : undefined,
      columns: item.columns
        ? item.columns
            .map((col) => ({
              ...col,
              children: filterEnabledNavItems(col.children ?? []),
            }))
            .filter((col) => col.children.length > 0)
        : undefined,
    }));
}

/**
 * Returns the effective list of child NavItems for a parent — flattened
 * across both `children` and `columns[*].children`. Used for active-state
 * checks and recursive lookups.
 */
export function flattenNavChildren(item: NavItem): NavItem[] {
  if (item.children && item.children.length > 0) return item.children;
  if (item.columns && item.columns.length > 0) {
    return item.columns.flatMap((c) => c.children ?? []);
  }
  return [];
}

export interface BrandingConfig {
  app_name: string;
  page_title: string;
  page_description: string;
  logo_mark: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  github_url?: string;
  navigation: NavItem[];
  landing_menu?: NavItem[];
  hero_title: string;
  hero_tagline: string;
  hero_image_url: string;
  show_auth_buttons?: boolean;
  service_endpoints: ServiceEndpoint[];

  // Login / Signup hero panel
  login_hero_tagline?: string;
  login_hero_primary?: string;
  login_hero_secondary?: string;

  // Footer CTA section
  footer_cta_tagline?: string;
  footer_cta_primary?: string;
  footer_cta_secondary?: string;
  footer_cta_button_text?: string;
  footer_cta_button_url?: string;

  // Footer credit line ("Built with ♥ by senthilsweb").
  // Override to rebrand for forks / internal instances; the default preserves
  // the original TemplrGo credit.
  footer_credit_prefix?: string;       // default: "Built with ♥ by"
  footer_credit_link_text?: string;    // default: "senthilsweb"
  footer_credit_link_url?: string;     // default: "https://github.com/senthilsweb"

  // Landing page hero config (landing-page-config-and-redirect Tier 1)
  hero_badge?: string;
  hero_heading?: string;
  hero_heading_highlight?: string;
  hero_heading_suffix?: string;
  hero_cta_primary_text?: string;
  hero_cta_primary_url?: string;
  hero_cta_secondary_text?: string;
  hero_cta_secondary_url?: string;
  home_route?: string;
  hidden_landing_sections?: string[];

  // Settings tab visibility (settings-tabs-visibility-control)
  hidden_settings_tabs?: string[];

  // CV / Resume template variants (add-cv-template-variant-editorial)
  cv_template_default?: "classic" | "editorial";
  cv_templates_enabled?: Array<"classic" | "editorial">;
}

export interface OpenSearchServer {
  name: string;
  host: string;
  port: string;
  protocol: string;
  skip_tls: boolean;
  is_default: boolean;
}

export interface MongoDBServer {
  name: string;
  host: string;
  port: string;
  is_default: boolean;
}

export interface PostgresServer {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl_mode: string;
  is_default: boolean;
}

export interface MySQLServer {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  flavor: "mysql" | "mariadb";
  ssl_mode: string;
  is_default: boolean;
}

export interface OpenObserveServer {
  name: string;
  host: string;
  base_path: string;
  username: string;
  password: string;
  skip_ssl: boolean;
  is_default: boolean;
}

export interface ServerConfigResponse {
  postgres_servers: PostgresServer[];
  openobserve_servers: OpenObserveServer[];
  opensearch_servers: OpenSearchServer[];
  mongodb_servers: MongoDBServer[];
  mysql_servers: MySQLServer[];
}

export type ThemeName =
  | "sunrise"
  | "slack"
  | "navy"
  | "emerald"
  | "rose"
  | "indigo"
  | "mintlify";

export const THEME_OPTIONS: { value: ThemeName; label: string; color: string }[] = [
  { value: "sunrise", label: "Sunrise", color: "#d4145a" },
  { value: "slack", label: "Slack Purple", color: "#4A154B" },
  { value: "navy", label: "Navy Blue", color: "#1e3a5f" },
  { value: "emerald", label: "Emerald Green", color: "#065f46" },
  { value: "rose", label: "Rose Red", color: "#881337" },
  { value: "indigo", label: "Indigo", color: "#4f46e5" },
  { value: "mintlify", label: "Mintlify Green", color: "#16a34a" },
];

/* ---- Title Font Options ---- */

export type TitleFontName =
  | "default"
  | "hey-august"
  | "playfair"
  | "caveat"
  | "satisfy"
  | "josefin"
  | "cormorant"
  | "abril"
  | "dancing";

export const TITLE_FONT_OPTIONS: {
  value: TitleFontName;
  label: string;
  style: string;
}[] = [
  { value: "default", label: "System Default (Geist)", style: "font-[family-name:var(--font-geist-sans)]" },
  { value: "hey-august", label: "Hey August", style: "font-[family-name:var(--font-title-hey-august)]" },
  { value: "playfair", label: "Playfair Display", style: "font-[family-name:var(--font-title-playfair)]" },
  { value: "caveat", label: "Caveat", style: "font-[family-name:var(--font-title-caveat)]" },
  { value: "satisfy", label: "Satisfy", style: "font-[family-name:var(--font-title-satisfy)]" },
  { value: "josefin", label: "Josefin Sans", style: "font-[family-name:var(--font-title-josefin)]" },
  { value: "cormorant", label: "Cormorant Garamond", style: "font-[family-name:var(--font-title-cormorant)]" },
  { value: "abril", label: "Abril Fatface", style: "font-[family-name:var(--font-title-abril)]" },
  { value: "dancing", label: "Dancing Script", style: "font-[family-name:var(--font-title-dancing)]" },
];
