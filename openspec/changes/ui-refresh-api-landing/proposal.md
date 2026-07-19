# Proposal — UI refresh: API page layout, drawer form standard, landing page

> **Related specs**:
> - [`openspec/project.md`](../../project.md) — architectural constraints
> - `templrgo/openspec/ui-page-standard.md` §4 — the canonical Sheet CRUD form standard this repo must follow

## Summary

Three cosmetic/layout defects hurt the perceived quality of TemplrPress:

1. **API reference page** — the third "Code Examples" column is oversized
   relative to its content, the vertical divider between the endpoint detail
   and the code column stops at the code panel's content height instead of
   running full height, and the endpoint-detail body is capped narrower than
   it needs to be (`max-w-3xl`) while ~440 px of viewport sits unused.
2. **Spec-settings drawer** — the slide-over form does not follow the
   TemplrGo Sheet form standard (§4 of `ui-page-standard.md`): section
   headings, field labels, and hints use ad-hoc styles instead of the
   Section/Field anatomy, and the persistence note says "the **TemplrGo**
   backend" inside TemplrPress.
3. **Landing page** — functional but not elegant: generic hero with no
   visual depth, three hard-coded feature cards, and a large dead band
   between hero and cards. Benchmarks: Mintlify (hero + quickstart strip),
   Ghost (typography, restraint), VuePress (config-driven feature grid).

All fixes stay inside the existing single-binary, config-driven architecture.
No new npm dependencies, no new Go dependencies, no new build steps.

## Problem statement

### 1. API page (`templrpress-nextjs/src/app/rest-api-spec/page.tsx`)

- The two-column row (line 1177) is a bare `<div className="flex">` with no
  `min-h` or stretch behavior. The divider is a `border-l` on the *code
  column child* (line 1184), which is `self-start` with its own
  `max-h`/`overflow-y-auto` — so the border's height equals the code panel's
  content height and visibly stops mid-page (screenshot: divider ends at
  ~y=740 while the endpoint detail continues).
- The code column is a fixed `w-[420px]` while its content (a tab strip and
  a code block) rarely needs more than ~360 px.
- The endpoint detail is capped at `max-w-3xl` (768 px), so on a 1920 px
  screen the row renders 288 + 768 + 420 = 1476 px and leaves ~444 px empty.

### 2. Spec-settings drawer (`templrpress-nextjs/src/components/rest-api/spec-settings-sheet.tsx`)

The sheet shell (themed header, footer button contract) already matches the
standard, but the body does not:

| §4 standard | Current sheet |
|---|---|
| Section legend: `text-xs font-semibold uppercase tracking-wider text-muted-foreground` | `<h3 className="text-sm font-semibold">` title-case headings |
| Field label above input: `text-xs font-medium text-muted-foreground`, `*` marker for required | Bare `Label className="text-xs"`, no marker convention |
| Hint text `text-[10px] text-muted-foreground` under the input | `text-[11px]`, placement inconsistent |
| Shared `Section`/`Field` helpers | Ad-hoc markup per section |

Plus the copy bug: "Token values are never sent to the **TemplrGo** backend."

### 3. Landing page (`templrpress-nextjs/src/app/page.tsx`)

- Feature cards (icon, title, description, link) are hard-coded in the
  component — not config-driven, contradicting the project's core promise.
- The hero has no visual anchor (no background treatment, no product
  glimpse) and `py-24 sm:py-32` on both hero and cards creates a large empty
  band (screenshot: ~430 px of whitespace between CTA buttons and cards).
- No "quickstart" moment. Mintlify/VuePress-style sites answer "how do I
  run this?" on the landing page with a one-line copyable command.

## Proposed solution

### Workstream A — API page layout

- Move the divider off the sticky child: wrap the code column in a plain
  full-height wrapper that carries `border-l`, and give the row
  `items-stretch` plus a `min-h` equal to the viewport minus navbar and
  toolbar. The divider then always runs the full visible height regardless
  of which column is taller.
- Narrow the code column: `w-[420px]` → `w-[360px]` (`xl:w-[400px]`).
- Widen the body: endpoint detail `max-w-3xl` → `max-w-4xl xl:max-w-5xl`
  with `min-w-0`, so wide tables/response lists breathe on large screens.

### Workstream B — Drawer form standard

- Add shared `Section` and `Field` helpers
  (`components/ui/sheet-form.tsx`) implementing the §4 anatomy verbatim
  (uppercase legend, muted label, required marker, 10px hint).
- Refactor `spec-settings-sheet.tsx` body to use them. Header/footer stay
  as-is (already standard).
- Replace the hard-coded "TemplrGo" copy with the branded app name from
  `useConfig()`.
- Copy the relevant §4 excerpt into `openspec/ui-page-standard.md` in this
  repo so the standard travels with the project.

### Workstream C — Landing page

Config-driven elegance, no new dependencies:

- **Hero**: subtle radial-gradient glow + dot-grid background (pure CSS),
  tighter heading tracking, highlight word colored with `--tg-primary`,
  reduced vertical padding to close the dead band.
- **Quickstart strip** (new, optional): a single copyable command in a
  terminal-styled block under the CTAs. Driven by two new branding fields;
  hidden when unset.
- **Feature cards**: driven by a new `features:` list in config
  (icon / title / description / url), rendered from a small allowlisted
  lucide icon map. Current three cards become the built-in default when the
  list is absent — zero-config behavior unchanged.
- Footer CTA band stays as-is (already config-driven).

## Scope

- `templrpress-nextjs/src/app/rest-api-spec/page.tsx` — column row classes only.
- `templrpress-nextjs/src/components/ui/sheet-form.tsx` — new, ~40 lines.
- `templrpress-nextjs/src/components/rest-api/spec-settings-sheet.tsx` — body refactor + copy fix.
- `templrpress-nextjs/src/app/page.tsx` — hero polish, quickstart strip, config-driven cards.
- `templrpress-nextjs/src/lib/config.ts` — `features`, `quickstart_*` type additions.
- `internal/config/config.go` — `FeatureCard` struct, `Features`, `QuickstartTitle/Command` fields + defaults.
- `internal/server/api.go` — `handleConfigBranding`: emit the new fields.
- `config.example.yaml` — document the new optional keys.
- `openspec/ui-page-standard.md` — new, imported §4 standard.
- `openspec/README.md` — register this change; correct the stale "north star"
  table that still forbids Next.js/React (the shipped stack).

## Non-goals

- No resizable/split-pane library, no shadcn additions, no CDN assets.
- No changes to the docs page, blog, about, or the OpenAPI parsing logic.
- No theming system changes — `--tg-primary` remains the single accent token.

## Acceptance criteria

- [ ] On `/rest-api-spec` at ≥1280 px, the divider between endpoint detail
  and code column spans the full content height for both short (e.g.
  `GET /pet/{petId}`) and long endpoints.
- [ ] Code column measures 360 px (400 px at ≥1280 px); endpoint detail is
  visibly wider than before on a 1920 px viewport.
- [ ] Spec-settings drawer sections render uppercase tracking legends and
  §4-style field labels/hints; no "TemplrGo" string remains anywhere in the
  templrpress SPA (`grep -ri templrgo src/` returns nothing user-visible).
- [ ] Landing page renders hero glow, quickstart strip, and feature cards
  from `config.yaml`; with a default (fieldless) config it renders exactly
  the current three cards and no quickstart strip.
- [ ] `make all` produces a single binary; `./bin/templrpress` serves the new
  UI with zero runtime network fetches beyond its own API.
- [ ] CI green on `main`.
