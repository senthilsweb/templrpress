"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// ============================================================================
// Theme-adaptive SVG illustrations for error states
// Uses currentColor and var(--tg-primary) to match any theme automatically.
// ============================================================================

function Illustration401() {
  return (
    <svg
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[280px] mx-auto"
      aria-hidden="true"
    >
      {/* Ground line */}
      <ellipse cx="140" cy="200" rx="120" ry="8" className="fill-muted/50" />
      {/* Shield body */}
      <path
        d="M140 30 L200 60 L200 120 C200 160 170 185 140 195 C110 185 80 160 80 120 L80 60 Z"
        className="fill-[var(--tg-primary)]/10 stroke-[var(--tg-primary)]"
        strokeWidth="2.5"
      />
      {/* Lock body */}
      <rect x="118" y="105" width="44" height="36" rx="6" className="fill-[var(--tg-primary)]/20 stroke-[var(--tg-primary)]" strokeWidth="2" />
      {/* Lock shackle */}
      <path
        d="M125 105 V92 C125 78 155 78 155 92 V105"
        className="stroke-[var(--tg-primary)]"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Keyhole */}
      <circle cx="140" cy="119" r="5" className="fill-[var(--tg-primary)]" />
      <rect x="138" y="122" width="4" height="8" rx="1" className="fill-[var(--tg-primary)]" />
      {/* Person silhouette - left */}
      <circle cx="52" cy="145" r="10" className="fill-muted-foreground/30" />
      <path d="M52 155 C38 160 38 178 40 185 L64 185 C66 178 66 160 52 155Z" className="fill-muted-foreground/20" />
      {/* X mark near person */}
      <path d="M66 140 L76 150 M76 140 L66 150" className="stroke-destructive" strokeWidth="2.5" strokeLinecap="round" />
      {/* Decorative dots */}
      <circle cx="220" cy="60" r="3" className="fill-[var(--tg-primary)]/30" />
      <circle cx="235" cy="75" r="2" className="fill-[var(--tg-primary)]/20" />
      <circle cx="55" cy="55" r="2.5" className="fill-[var(--tg-primary)]/25" />
    </svg>
  );
}

function Illustration403() {
  return (
    <svg
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[280px] mx-auto"
      aria-hidden="true"
    >
      {/* Ground */}
      <ellipse cx="140" cy="200" rx="120" ry="8" className="fill-muted/50" />
      {/* Wall / barrier */}
      <rect x="30" y="60" width="220" height="130" rx="12" className="fill-muted/30 stroke-border" strokeWidth="1.5" />
      {/* Barrier stripes */}
      <line x1="30" y1="90" x2="250" y2="90" className="stroke-[var(--tg-primary)]/20" strokeWidth="1" />
      <line x1="30" y1="120" x2="250" y2="120" className="stroke-[var(--tg-primary)]/20" strokeWidth="1" />
      <line x1="30" y1="150" x2="250" y2="150" className="stroke-[var(--tg-primary)]/20" strokeWidth="1" />
      {/* Stop hand */}
      <g transform="translate(110, 85)">
        <circle cx="30" cy="30" r="28" className="fill-[var(--tg-primary)]/10 stroke-[var(--tg-primary)]" strokeWidth="2" />
        {/* Palm */}
        <path
          d="M22 44 L22 28 C22 25 26 25 26 28 L26 22 C26 19 30 19 30 22 L30 20 C30 17 34 17 34 20 L34 22 C34 19 38 19 38 22 L38 36 L40 32 C42 29 45 31 43 34 L38 44 Z"
          className="fill-[var(--tg-primary)]/20 stroke-[var(--tg-primary)]"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      {/* Person silhouette outside */}
      <circle cx="140" cy="38" r="8" className="fill-muted-foreground/40" />
      <path d="M140 46 C130 50 130 62 131 66 L149 66 C150 62 150 50 140 46Z" className="fill-muted-foreground/25" />
      {/* Arrow bouncing off */}
      <path d="M140 70 L140 78 L146 74" className="stroke-[var(--tg-primary)]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Dots */}
      <circle cx="15" cy="50" r="3" className="fill-[var(--tg-primary)]/20" />
      <circle cx="265" cy="45" r="2" className="fill-[var(--tg-primary)]/30" />
    </svg>
  );
}

function Illustration404() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[320px] mx-auto"
      aria-hidden="true"
    >
      {/* Ground */}
      <ellipse cx="160" cy="220" rx="140" ry="10" className="fill-muted/50" />
      {/* Magnifying glass */}
      <circle cx="130" cy="100" r="50" className="stroke-[var(--tg-primary)]" strokeWidth="3" fill="none" />
      <circle cx="130" cy="100" r="42" className="fill-[var(--tg-primary)]/5" />
      <line x1="168" y1="138" x2="200" y2="170" className="stroke-[var(--tg-primary)]" strokeWidth="5" strokeLinecap="round" />
      {/* Question mark inside magnifier */}
      <text x="130" y="115" textAnchor="middle" className="fill-[var(--tg-primary)]" fontSize="40" fontWeight="bold" fontFamily="system-ui">?</text>
      {/* Broken link pieces */}
      <path d="M210 80 C220 70 235 70 245 80 L250 85" className="stroke-muted-foreground/40" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M225 95 C235 85 250 85 260 95 L265 100" className="stroke-muted-foreground/40" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Small x between links */}
      <path d="M238 82 L245 89 M245 82 L238 89" className="stroke-destructive/60" strokeWidth="2" strokeLinecap="round" />
      {/* Person looking confused */}
      <circle cx="75" cy="160" r="12" className="fill-muted-foreground/30" />
      <path d="M75 172 C58 178 58 200 60 210 L90 210 C92 200 92 178 75 172Z" className="fill-muted-foreground/20" />
      {/* Question marks floating */}
      <text x="88" y="152" className="fill-[var(--tg-primary)]/40" fontSize="14" fontFamily="system-ui">?</text>
      <text x="58" y="148" className="fill-[var(--tg-primary)]/25" fontSize="10" fontFamily="system-ui">?</text>
      {/* Decorative circles */}
      <circle cx="270" cy="55" r="4" className="fill-[var(--tg-primary)]/20" />
      <circle cx="285" cy="70" r="2.5" className="fill-[var(--tg-primary)]/15" />
      <circle cx="40" cy="60" r="3" className="fill-[var(--tg-primary)]/25" />
    </svg>
  );
}

function Illustration500() {
  return (
    <svg
      viewBox="0 0 300 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[300px] mx-auto"
      aria-hidden="true"
    >
      {/* Ground */}
      <ellipse cx="150" cy="215" rx="130" ry="8" className="fill-muted/50" />
      {/* Server rack */}
      <rect x="90" y="50" width="120" height="155" rx="8" className="fill-muted/30 stroke-border" strokeWidth="1.5" />
      {/* Server units */}
      <rect x="100" y="62" width="100" height="25" rx="4" className="fill-background stroke-border" strokeWidth="1" />
      <rect x="100" y="95" width="100" height="25" rx="4" className="fill-background stroke-border" strokeWidth="1" />
      <rect x="100" y="128" width="100" height="25" rx="4" className="fill-background stroke-border" strokeWidth="1" />
      <rect x="100" y="161" width="100" height="25" rx="4" className="fill-background stroke-border" strokeWidth="1" />
      {/* Server LEDs - mix of normal and error */}
      <circle cx="112" cy="74" r="3" className="fill-emerald-400" />
      <circle cx="122" cy="74" r="3" className="fill-emerald-400" />
      <circle cx="112" cy="107" r="3" className="fill-destructive animate-pulse" />
      <circle cx="122" cy="107" r="3" className="fill-amber-400" />
      <circle cx="112" cy="140" r="3" className="fill-destructive animate-pulse" />
      <circle cx="122" cy="140" r="3" className="fill-destructive animate-pulse" />
      <circle cx="112" cy="173" r="3" className="fill-muted-foreground/30" />
      <circle cx="122" cy="173" r="3" className="fill-muted-foreground/30" />
      {/* Server line details */}
      <line x1="155" y1="74" x2="190" y2="74" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="107" x2="190" y2="107" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="140" x2="190" y2="140" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="173" x2="190" y2="173" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
      {/* Lightning bolt / error */}
      <path
        d="M240 55 L225 90 L240 90 L220 130"
        className="stroke-[var(--tg-primary)] fill-none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparks */}
      <circle cx="245" cy="70" r="2" className="fill-[var(--tg-primary)]/40" />
      <circle cx="250" cy="85" r="1.5" className="fill-[var(--tg-primary)]/30" />
      <circle cx="218" cy="135" r="2" className="fill-[var(--tg-primary)]/35" />
      {/* Exclamation triangle */}
      <path d="M55 130 L30 170 L80 170 Z" className="fill-[var(--tg-primary)]/10 stroke-[var(--tg-primary)]" strokeWidth="2" strokeLinejoin="round" />
      <line x1="55" y1="143" x2="55" y2="158" className="stroke-[var(--tg-primary)]" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="55" cy="164" r="2" className="fill-[var(--tg-primary)]" />
      {/* Smoke/cloud */}
      <circle cx="138" cy="35" r="10" className="fill-muted-foreground/10" />
      <circle cx="152" cy="30" r="12" className="fill-muted-foreground/10" />
      <circle cx="165" cy="35" r="9" className="fill-muted-foreground/10" />
    </svg>
  );
}

// ============================================================================
// Illustration map
// ============================================================================

const illustrations: Record<string, React.FC> = {
  "401": Illustration401,
  "403": Illustration403,
  "404": Illustration404,
  "500": Illustration500,
};

// ============================================================================
// ErrorState – unified error display component
// ============================================================================

export type ErrorStateVariant = "401" | "403" | "404" | "500";

interface ErrorStateProps {
  /** HTTP error code to determine illustration + defaults */
  variant: ErrorStateVariant;
  /** Override the heading text */
  title?: string;
  /** Override the detail/description message */
  message?: string;
  /** Show a "Try Again" button that calls this handler */
  onRetry?: () => void;
  /** Show a "Go Home" button (default: true) */
  showHomeButton?: boolean;
  /** Additional action buttons */
  children?: React.ReactNode;
}

const defaults: Record<ErrorStateVariant, { title: string; message: string }> = {
  "401": {
    title: "Authentication Required",
    message: "You need to sign in to access this page. Please log in with an account that has the required permissions.",
  },
  "403": {
    title: "Access Denied",
    message: "You don't have permission to view this page. Contact your administrator to request access.",
  },
  "404": {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved. Check the URL or navigate back home.",
  },
  "500": {
    title: "Something Went Wrong",
    message: "An unexpected error occurred on our end. Please try again, or contact support if the problem persists.",
  },
};

export function ErrorState({
  variant,
  title,
  message,
  onRetry,
  showHomeButton = true,
  children,
}: ErrorStateProps) {
  const Illustration = illustrations[variant] ?? Illustration500;
  const d = defaults[variant] ?? defaults["500"];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Illustration */}
        <div className="mb-8">
          <Illustration />
        </div>

        {/* Error code badge */}
        <div className="mb-4 inline-flex items-center rounded-full border border-[var(--tg-primary)]/20 bg-[var(--tg-primary)]/5 px-3 py-1 text-xs font-semibold tracking-wider text-[var(--tg-primary)]">
          {variant}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
          {title ?? d.title}
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {message ?? d.message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {showHomeButton && (
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-[var(--tg-primary)] text-white hover:bg-[var(--tg-primary)]/90"
            >
              Try Again
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
