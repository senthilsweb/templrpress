# UI Standard — Sheet (Drawer) Forms

> Imported from the TemplrGo `ui-page-standard.md` §4 and adapted for
> TemplrPress. Any slide-over drawer containing a form MUST follow this
> contract. Shared helpers live in
> `templrpress-nextjs/src/components/ui/sheet-form.tsx`.

## 1. Component

All drawers use the shadcn `Sheet` from `@/components/ui/sheet`, sliding in
from the right. Content shell:

```tsx
<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
```

Full width on mobile, capped at `sm:max-w-xl` on desktop. `p-0` — the three
regions manage their own padding.

## 2. Structure

```
┌─── Header (bg: var(--tg-primary), white text, px-6 py-4) ────────────┐
│ Title ("New {Entity}" / "Edit {Entity}" / "{Purpose} · {Context}")   │
│ Description (text-white/80, one sentence)                            │
├─── Body (flex-1 overflow-y-auto px-6 py-5 space-y-6) ────────────────┤
│                                                                      │
│ SECTION LEGEND (text-xs font-semibold uppercase tracking-wider       │
│                 text-muted-foreground)                               │
│ Field label (text-xs font-medium text-muted-foreground, * required)  │
│ [Input — full width, one field per row]                              │
│ hint (text-[10px] text-muted-foreground)                             │
│                                                                      │
├─── Footer (border-t px-6 py-4, bg-background) ───────────────────────┤
│ [secondary: Reset — only if applicable]   [ghost: Close] [primary]   │
└──────────────────────────────────────────────────────────────────────┘
```

- Header: `<SheetHeader className="border-b bg-[var(--tg-primary)] px-6 py-4 text-white">`,
  `<SheetTitle className="text-white">`, `<SheetDescription className="text-white/80">`.
- Body sections: `<SheetFormSection title="…">`; fields: `<SheetFormField
  label="…" htmlFor="…" required hint="…">` — never ad-hoc `<h3>`/`<Label>`.
- One field per row, inputs full width. Mono content gets `font-mono text-xs`.
- Footer primary button: `className="bg-[var(--tg-primary)] text-white
  hover:bg-[var(--tg-primary)]/90"`. With a Reset action the footer row is
  `justify-between` (Reset far left); otherwise `justify-end`.

## 3. Inputs

| Field type | Component |
|------------|-----------|
| Short text | `Input` |
| Long text | `Textarea` with explicit `rows` |
| Dropdown | `Select` |
| Password/secret | `Input type="password"` + Eye/EyeOff toggle |
| JSON/code | `Textarea` with `font-mono text-xs` |

## 4. Behavior

- Controlled `open` state; parent owns it.
- Required fields marked with `*`; validate on submit; `toast.error()` for
  validation messages, `toast.success()` on save.
- Form state remounts when the drawer opens (load in an `open`-gated
  `useEffect` or pass a changing `key`).
- Copy must use the branded app name from `useConfig()` — never a
  hard-coded product name.

## Reference implementation

`templrpress-nextjs/src/components/rest-api/spec-settings-sheet.tsx`
