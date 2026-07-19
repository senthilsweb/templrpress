# Tasks — ui-refresh-api-landing

> References: [`proposal.md`](./proposal.md) · [`design.md`](./design.md)

## A. API page layout

- [x] 1. `app/rest-api-spec/page.tsx` — row div (line ~1177): add
       `items-stretch min-h-[calc(100vh-56px-49px)]`.
- [x] 2. Middle column: `max-w-3xl` → `max-w-4xl xl:max-w-5xl`, add
       `min-w-0`, bump padding to `p-6 lg:p-8`.
- [x] 3. Right column: split into outer wrapper
       (`hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 border-l`) and
       inner sticky scroller (`sticky top-12 max-h-[calc(100vh-56px-48px)]
       overflow-y-auto p-5`); verify divider spans full height on a short
       endpoint (`GET /pet/{petId}`) and a long one (`POST /pet`).

## B. Drawer form standard

- [x] 4. Create `components/ui/sheet-form.tsx` with `SheetFormSection` /
       `SheetFormField` per design.
- [x] 5. Refactor `components/rest-api/spec-settings-sheet.tsx` body to use
       the helpers (Base URL + Global headers sections).
- [x] 6. Replace "TemplrGo backend" copy with the app name from
       `useConfig()`; sweep `grep -ri templrgo templrpress-nextjs/src` and fix
       any other user-visible hits.
- [x] 7. Add `openspec/ui-page-standard.md` with the imported §4 Sheet form
       contract (adapted paths/names for this repo).

## C. Landing page

- [x] 8. `internal/config/config.go` — add `FeatureCard`, and
       `QuickstartTitle`, `QuickstartCommand`, `Features` to `BrandingConfig`.
- [x] 9. `internal/server/api.go` — emit `quickstart_title`,
       `quickstart_command`, `features` in `handleConfigBranding`.
- [x] 10. `config.example.yaml` — commented example block (3 feature cards +
       quickstart command).
- [x] 11. `lib/config.ts` — extend `BrandingConfig` type.
- [x] 12. `app/page.tsx` — hero glow/dot-grid background, tightened spacing
       (`py-20 sm:py-24` hero / `py-16` features), quickstart strip with copy
       button (hidden when `quickstart_command` empty).
- [x] 13. `app/page.tsx` — render feature cards from `branding.features`
       with the allowlisted lucide icon map; keep current three cards as the
       nil-config fallback; hover lift + `--tg-primary` border tint.

## Verification & housekeeping

- [x] 14. `make all`; run binary; screenshot `/`, `/rest-api-spec` (short +
       long endpoint), and the settings drawer at 1440/1920 px, light + dark.
- [x] 15. Confirm default config renders: three default cards, no
       quickstart strip, unchanged docs/blog/about pages.
- [x] 16. `openspec/README.md` — add this change to Active changes; fix the
       stale north-star table (stack is Next.js/React SPA + Go, not
       "Tailwind + Swagger UI via CDN / no React").
- [ ] 17. CI green on `main`.
