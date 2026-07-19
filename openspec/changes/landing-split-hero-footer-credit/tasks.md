# Tasks — landing-split-hero-footer-credit

> References: [`proposal.md`](./proposal.md)

- [x] 1. `internal/config/config.go` — add `HeroLayout`, `HeroCodeTitle`,
       `HeroCode`, `QuickstartCommands []QuickstartEntry{Title,Command}`.
- [x] 2. `internal/server/api.go` — emit `hero_layout`, `hero_code_title`,
       `hero_code`, `quickstart_commands`.
- [x] 3. `lib/config.ts` — mirror the new fields.
- [x] 4. `app/page.tsx` — quickstart list rendering (fallback: single
       legacy pair), split-hero layout with mac-window YAML card.
- [x] 5. `components/layout/footer.tsx` — heart icon + GitHub mark in the
       credit line.
- [x] 6. `config.example.yaml` — split hero + two quickstart commands +
       "Made with" credit.
- [x] 7. Build, screenshot landing (split) + footer, verify centered
       fallback with a minimal config.
- [x] 8. Register in openspec/README.md.
