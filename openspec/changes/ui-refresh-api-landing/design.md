# Design — ui-refresh-api-landing

> References: [`proposal.md`](./proposal.md)

## A. API page column geometry

File: `templrpress-nextjs/src/app/rest-api-spec/page.tsx`

### Before (lines 1177–1186)

```tsx
<div className="flex">
  <div className="flex-1 p-6 max-w-3xl">
    <EndpointDetail ... />
  </div>
  <div className="hidden lg:block w-[420px] flex-shrink-0 border-l p-5 sticky top-12 self-start max-h-[calc(100vh-56px-48px)] overflow-y-auto">
    <CodePanel ... />
  </div>
</div>
```

Defect: `border-l` lives on the sticky, content-height child → divider stops
where the code panel ends. `max-w-3xl` + `w-[420px]` leaves ~444 px unused at
1920 px.

### After

```tsx
<div className="flex items-stretch min-h-[calc(100vh-56px-49px)]">
  <div className="flex-1 min-w-0 p-6 lg:p-8 max-w-4xl xl:max-w-5xl">
    <EndpointDetail ... />
  </div>
  <div className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 border-l">
    <div className="sticky top-12 max-h-[calc(100vh-56px-48px)] overflow-y-auto p-5">
      <CodePanel ... />
    </div>
  </div>
</div>
```

Key moves:

| Concern | Mechanism |
|---|---|
| Full-height divider | `border-l` on a non-sticky wrapper; flex default stretch + row `min-h` (navbar 56 px + sticky toolbar ~49 px) guarantees the border reaches the fold even for short endpoints |
| Sticky code panel | preserved on the *inner* div, unchanged behavior |
| Wider body | `max-w-3xl` → `max-w-4xl xl:max-w-5xl`, `min-w-0` guards table overflow |
| Right column width | `w-[420px]` → `w-[360px] xl:w-[400px]` |

No JS changes; classes only.

## B. Sheet form helpers

New file: `templrpress-nextjs/src/components/ui/sheet-form.tsx` (~40 lines,
no deps beyond React):

```tsx
export function SheetFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

export function SheetFormField({ label, htmlFor, required, hint, children }: {
  label: string; htmlFor?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-red-600 dark:text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
```

`spec-settings-sheet.tsx` body mapping:

| Current | Becomes |
|---|---|
| `<section><h3 className="text-sm font-semibold">Base URL</h3>…` | `<SheetFormSection title="Base URL">…` |
| `<Label className="text-xs">Override</Label> + <Input/> + <p className="text-[11px]">` | `<SheetFormField label="Override" htmlFor="base-url-override" hint="Leave blank to use the spec's declared server URL."><Input …/></SheetFormField>` |
| `<h3>Global headers</h3>` | `<SheetFormSection title="Global headers">` (header rows unchanged inside) |
| "…never sent to the TemplrGo backend." | `` `…never sent to the ${branding.app_name} backend.` `` via `useConfig()` |

Header (`bg-[var(--tg-primary)]`) and footer (Reset left / Close + Save
right) already conform — untouched.

Also copy §4 "Sheet CRUD Form" of templrgo's `ui-page-standard.md` into
`openspec/ui-page-standard.md` here, so future drawers (and reviewers) have
the contract in-repo.

## C. Landing page

### Config model

`internal/config/config.go`:

```go
type FeatureCard struct {
    Icon        string `yaml:"icon"`        // allowlisted lucide name: book-open|code|file-text|zap|rocket|layers|globe|terminal
    Title       string `yaml:"title"`
    Description string `yaml:"description"`
    URL         string `yaml:"url"`
}

// BrandingConfig additions
QuickstartTitle   string        `yaml:"quickstart_title"`   // e.g. "Run it in one line"
QuickstartCommand string        `yaml:"quickstart_command"` // e.g. docker run …
Features          []FeatureCard `yaml:"features"`
```

Defaults: `Features` nil → SPA falls back to today's three built-in cards;
`QuickstartCommand` empty → strip hidden. Zero-config output is unchanged
except visual polish.

`internal/server/api.go` — `handleConfigBranding` additionally emits:

```json
"quickstart_title": "...",
"quickstart_command": "...",
"features": [{"icon": "book-open", "title": "...", "description": "...", "url": "/docs"}]
```

`config.example.yaml` gains a commented block under `branding:`.

### Page anatomy (`app/page.tsx`)

```
┌─ Hero ──────────────────────────────────────────────┐
│  bg: radial-gradient glow (tg-primary @ 6% alpha)   │
│      + CSS dot grid, masked to fade at edges        │
│  [badge pill]                                       │
│  H1  tracking-tight, highlight in var(--tg-primary) │
│  tagline (max-w-2xl)                                │
│  [primary CTA] [secondary CTA]                      │
│  ┌ quickstart strip (optional) ──────────────────┐  │
│  │ $ docker run --rm -p 5000:5000 ghcr.io/…  [⧉] │  │
│  └───────────────────────────────────────────────┘  │
├─ Features ── py-16 (was py-20/24 gap) ──────────────┤
│  [card] [card] [card]   ← from config or defaults   │
│  hover: border tint tg-primary/40 + shadow-sm lift  │
├─ CTA band (existing footer component, unchanged) ───┤
```

Implementation notes:

- Glow/grid is pure CSS (`background-image: radial-gradient(...)` +
  `radial-gradient` dots with a mask) — no images, no CDN, dark-mode aware
  via existing semantic tokens.
- Hero `py-24 sm:py-32` → `py-20 sm:py-24`; features `py-20` → `py-16`;
  kills the ~430 px dead band.
- Quickstart strip: `font-mono text-sm` block styled like the existing
  `CodePanel` chrome, copy button reuses the clipboard pattern already in
  `CodePanel` (no new dep).
- Icon map: `Record<string, LucideIcon>` with the 8 allowlisted names above;
  unknown icon → `FileText` fallback. Avoids dynamic-import complexity.

## Dependency & constraint check

| Constraint | Status |
|---|---|
| Single binary | ✅ SPA changes compile into `out/`, embedded as today |
| Config-driven | ✅ new keys optional, defaults preserve current output |
| No new npm deps | ✅ lucide-react, shadcn Sheet, sonner already present |
| No new Go deps | ✅ struct + JSON fields only |
| Dark mode | ✅ semantic tokens; glow uses `--tg-primary` at low alpha |

## Rollout

Classes-only for the API page (zero behavioral risk), additive config for
the landing page. One PR, one `make all`, screenshot before/after in the PR
description at 1440 px and 1920 px.
