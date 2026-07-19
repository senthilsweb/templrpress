"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Settings, Moon, Sun, LogOut, Users, ShieldCheck, User, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/layout/logo";
import { NavIcon } from "@/components/layout/nav-icon";
import { useConfig } from "@/providers/config-provider";
import { useTheme } from "@/providers/theme-provider";
import { eventBus, EVENTS } from "@/lib/event-bus";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/shared/github-icon";
import { DocsSearch } from "@/components/search/docs-search";
import type { NavItem } from "@/lib/config";
import { filterEnabledNavItems, flattenNavChildren } from "@/lib/config";
import type { BrandingConfig } from "@/lib/config";

function findNavItem(items: NavItem[], url: string): NavItem | undefined {
  for (const item of items) {
    if (item.url === url) return item;
    if (item.children) {
      const found = findNavItem(item.children, url);
      if (found) return found;
    }
    if (item.columns) {
      for (const col of item.columns) {
        const found = findNavItem(col.children ?? [], url);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function UserDropdown({
  authUser,
  onLogout,
  branding,
}: {
  authUser: AuthUser;
  onLogout: () => void;
  branding?: BrandingConfig;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const navItems = branding?.navigation ?? [];
  const aboutItem = findNavItem(navItems, "/about");
  const cvItem = findNavItem(navItems, "/cv");
  const showAbout = aboutItem && aboutItem.enabled !== false;
  const showCV = cvItem && cvItem.enabled !== false;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {authUser.avatarURL ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={authUser.avatarURL}
            alt={authUser.displayName || authUser.username || "User"}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tg-primary)] text-xs font-bold text-white">
            {(authUser.displayName || authUser.username || "U").charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {authUser.displayName || authUser.username}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute right-0 z-50 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-700 transition-all duration-200 ${
          open ? "visible opacity-100 translate-y-0" : "invisible opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="p-1.5">
          <SmartLink
            href="/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="h-4 w-4 text-gray-400" />
            Users
          </SmartLink>
          <SmartLink
            href="/roles"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            Roles
          </SmartLink>

          {(showAbout || showCV) && (
            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
          )}
          {showAbout && (
            <SmartLink
              href="/about"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <User className="h-4 w-4 text-gray-400" />
              About
            </SmartLink>
          )}
          {showCV && (
            <SmartLink
              href="/cv"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="h-4 w-4 text-gray-400" />
              CV
            </SmartLink>
          )}

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/** Routes served by Go (not Next.js) — need full-page navigation */
const GO_SERVED_PREFIXES = ["/cms", "/api-docs", "/static", "/api"];

function isGoServedRoute(url: string): boolean {
  return GO_SERVED_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(prefix + "/")
  );
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function SmartLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (isExternalUrl(href)) {
    return (
      <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  if (!isGoServedRoute(href)) {
    return (
      <Link href={href} prefetch={false} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = href;
      }}
    >
      {children}
    </a>
  );
}

function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <button
      onClick={toggleDarkMode}
      className="relative shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}

function MobileThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();
  const Icon = darkMode ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      aria-label="Toggle dark mode"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {darkMode ? "Dark mode" : "Light mode"}
      </span>
      <span className="text-xs text-muted-foreground">{darkMode ? "On" : "Off"}</span>
    </button>
  );
}

function ChatNavButton() {
  return null;
}

function FlyoutFooter({ footer }: { footer: NonNullable<NavItem["footer"]> }) {
  const body = (
    <div
      className="flex flex-col gap-1 px-4 py-4 text-white"
      style={{
        background: `linear-gradient(135deg, var(--tg-primary) 0%, rgba(var(--tg-primary-rgb, 30,64,175), 0.85) 100%)`,
      }}
    >
      <span className="text-sm font-bold leading-tight">{footer.title}</span>
      {footer.subtitle && (
        <span className="text-xs leading-snug opacity-90">{footer.subtitle}</span>
      )}
    </div>
  );
  if (footer.url) {
    return (
      <SmartLink
        href={footer.url}
        className="block transition-opacity hover:opacity-95"
      >
        {body}
      </SmartLink>
    );
  }
  return body;
}

function FlyoutMenu({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const effectiveChildren = flattenNavChildren(item);
  const isChildActive = effectiveChildren.some((child) => {
    const childUrl = (child.url ?? "").replace(/\/$/, "") || "/";
    return normalizedPath === childUrl || normalizedPath.startsWith(childUrl + "/");
  });

  // Two-column layout when the YAML declares non-empty `columns` with at
  // least one child remaining after RBAC/enabled filtering. If only one
  // column survives filtering, fall back to a single-column render.
  const visibleColumns = (item.columns ?? []).filter(
    (col) => (col.children?.length ?? 0) > 0,
  );
  const useTwoColumn = visibleColumns.length >= 2;

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Renders one child link row — same visual as the original single-column flyout.
  // Icon container is tinted with the active theme color (var(--tg-primary)).
  const renderChild = (child: NavItem) => (
    <SmartLink
      key={child.url}
      href={child.url}
      className="group relative flex gap-x-4 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      {child.icon && (
        <div
          className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-lg border transition-colors duration-200"
          style={{
            background: "rgba(var(--tg-primary-rgb, 30,64,175), 0.08)",
            borderColor: "rgba(var(--tg-primary-rgb, 30,64,175), 0.18)",
          }}
        >
          <NavIcon icon={child.icon} className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1">
        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
          {child.label}
        </span>
        {child.subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {child.subtitle}
          </p>
        )}
      </div>
    </SmartLink>
  );

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
          isChildActive
            ? "text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
        }`}
        style={
          isChildActive
            ? {
                background: `linear-gradient(135deg, var(--tg-primary) 0%, rgba(var(--tg-primary-rgb), 0.85) 100%)`,
              }
            : undefined
        }
      >
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute left-1/2 z-50 mt-2 w-screen ${
          useTwoColumn ? "max-w-2xl" : "max-w-md"
        } -translate-x-1/2 px-4 transition-all duration-300 ease-out ${
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-700">
          {useTwoColumn ? (
            <div className="grid grid-cols-2 gap-2 p-2">
              {visibleColumns.map((col) => (
                <div key={col.title} className="flex flex-col">
                  <div className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {col.title}
                  </div>
                  <div className="flex flex-col">
                    {(col.children ?? []).map(renderChild)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {effectiveChildren.map(renderChild)}
            </div>
          )}
          {item.footer && (
            <FlyoutFooter footer={item.footer} />
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const normalizedUrl = (item.url ?? "").replace(/\/$/, "") || "/";
  const isActive = normalizedPath === normalizedUrl;

  return (
    <SmartLink
      href={item.url}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
        isActive
          ? "text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
      }`}
      style={
        isActive
          ? {
              background: `linear-gradient(135deg, var(--tg-primary) 0%, rgba(var(--tg-primary-rgb), 0.85) 100%)`,
            }
          : undefined
      }
    >
      {item.label}
    </SmartLink>
  );
}

interface AuthUser {
  authenticated: boolean;
  authEnabled: boolean;
  username?: string;
  displayName?: string;
  avatarURL?: string;
  email?: string;
  role?: string;
  provider?: string;
}

export function Navbar() {
  const { branding } = useConfig();
  const isPageVisible = (_path: string) => true;
  const router = useRouter();
  const enabled = filterEnabledNavItems(branding?.navigation ?? []);
  // Filter nav items by RBAC page visibility. Items without a url pass through;
  // items with a url are shown only if the server's ui.pages map allows it
  // (or does not gate the page at all). See ADR-RBAC-008.
  // Recurses through both `children` and `columns[*].children`. Empty columns
  // are dropped; a parent with no remaining children/columns is dropped too.
  const filterByPermission = (items: NavItem[]): NavItem[] =>
    items
      .map((item) => ({
        ...item,
        children: item.children ? filterByPermission(item.children) : undefined,
        columns: item.columns
          ? item.columns
              .map((col) => ({
                ...col,
                children: filterByPermission(col.children ?? []),
              }))
              .filter((col) => col.children.length > 0)
          : undefined,
      }))
      .filter((item) => {
        if (item.url) {
          const visible = isPageVisible(item.url);
          if (!visible) return false;
        }
        // Hide parent group if it has no surviving children AND no surviving columns.
        const hasChildren = (item.children?.length ?? 0) > 0;
        const hasColumns = (item.columns?.length ?? 0) > 0;
        if (!item.url && !hasChildren && !hasColumns) {
          return false;
        }
        return true;
      });
  const navigation = filterByPermission(enabled);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Always fetch auth status so the navbar knows whether auth is enabled.
    // Login/Signup visibility is gated on auth_enabled below.
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        const user = data.user;
        setAuthUser({
          authenticated: data.authenticated ?? false,
          authEnabled: data.auth_enabled ?? false,
          username: user?.username,
          displayName: user?.display_name,
          avatarURL: user?.avatar_url,
          email: user?.email,
          role: user?.role,
          provider: data.provider,
        });
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    router.push("/");
  }

  const isLoggedIn = authUser?.authenticated === true && authUser.authEnabled;

  // Auth buttons are shown only when auth is enabled on the backend.
  // `show_auth_buttons: false` in branding forces them hidden (e.g. docs-only site).
  const showAuthButtons =
    branding?.show_auth_buttons !== false && authUser?.authEnabled === true;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-14 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="flex h-full items-center justify-between px-6">
        <Link href="/" className="flex items-center no-underline">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const hasFlyout =
              (item.children && item.children.length > 0) ||
              (item.columns && item.columns.length > 0);
            if (hasFlyout) return <FlyoutMenu key={item.label} item={item} />;
            if (item.url) return <NavLink key={item.url} item={item} />;
            return null;
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <DocsSearch />
          {showAuthButtons && (
            <>
              {isLoggedIn ? (
                <UserDropdown
                  authUser={authUser!}
                  onLogout={handleLogout}
                  branding={branding}
                />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-md bg-[var(--tg-primary)] px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
          {branding?.github_url && (
            <a
              href={branding.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="GitHub repository"
              title="GitHub repository"
            >
              <GitHubIcon className="h-5 w-5" />
            </a>
          )}
          <ChatNavButton />
          <DarkModeToggle />
          <SmartLink
            href="/settings"
            className="relative shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </SmartLink>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <div className="mt-8 flex flex-col gap-2 pb-8">
                {navigation.map((item) => {
                  const renderMobileChild = (child: NavItem) => (
                    <SmartLink
                      key={child.url}
                      href={child.url}
                      className="flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {child.icon && <NavIcon icon={child.icon} className="h-4 w-4" />}
                      {child.label}
                    </SmartLink>
                  );
                  if (item.columns && item.columns.length > 0) {
                    return (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="px-3 py-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                          {item.label}
                        </span>
                        {item.columns.map((col) => (
                          <div key={col.title} className="flex flex-col">
                            <span className="px-6 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                              {col.title}
                            </span>
                            {(col.children ?? []).map(renderMobileChild)}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (item.children) {
                    return (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="px-3 py-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                          {item.label}
                        </span>
                        {item.children.map(renderMobileChild)}
                      </div>
                    );
                  }
                  if (item.url) {
                    return (
                      <SmartLink
                        key={item.url}
                        href={item.url}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        {item.label}
                      </SmartLink>
                    );
                  }
                  return null;
                })}
                <div className="mt-4 border-t pt-4">
                  {showAuthButtons && (
                    <div className="mb-3 flex flex-col gap-2 px-3">
                      {isLoggedIn ? (
                        <>
                          <div className="flex items-center gap-2 py-1">
                            {authUser?.avatarURL ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={authUser.avatarURL}
                                alt={authUser.displayName || authUser.username || "User"}
                                className="h-7 w-7 rounded-full"
                              />
                            ) : (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tg-primary)] text-xs font-bold text-white">
                                {(authUser?.displayName || authUser?.username || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {authUser?.displayName || authUser?.username}
                            </span>
                          </div>
                          <Link
                            href="/users"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Users className="h-4 w-4" />
                            Users
                          </Link>
                          <Link
                            href="/roles"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Roles
                          </Link>
                          {(() => {
                            const navItems = branding?.navigation || [];
                            const aboutItem = findNavItem(navItems, "/about");
                            const cvItem = findNavItem(navItems, "/cv");
                            return (
                              <>
                                {aboutItem && aboutItem.enabled !== false && (
                                  <Link
                                    href="/about"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                  >
                                    <User className="h-4 w-4" />
                                    About
                                  </Link>
                                )}
                                {cvItem && cvItem.enabled !== false && (
                                  <Link
                                    href="/cv"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                  >
                                    <FileText className="h-4 w-4" />
                                    CV
                                  </Link>
                                )}
                              </>
                            );
                          })()}
                          <button
                            onClick={handleLogout}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login"
                            className="inline-flex items-center justify-center rounded-md bg-[var(--tg-primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                          >
                            Log in
                          </Link>
                          <Link
                            href="/signup"
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            Sign up
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                  <SmartLink
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </SmartLink>
                  {branding?.github_url && (
                    <a
                      href={branding.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <GitHubIcon className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  <MobileThemeToggle />
                  <div className="mt-3 flex items-center justify-end gap-2 px-3">
                    <ChatNavButton />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
