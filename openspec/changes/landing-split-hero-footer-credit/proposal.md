# Proposal — Split hero, multi-line quickstart, footer credit with heart

> **Related specs**: [`openspec/project.md`](../../project.md) ·
> [`ui-refresh-api-landing`](../ui-refresh-api-landing/proposal.md) (split
> hero was listed there as designed-not-built)

## Summary

Three landing-page refinements, all config-driven:

1. **Footer credit** — render "Made with ♥ from <GitHub>" in the bottom
   bar: a heart icon between prefix and link, and a GitHub mark when the
   credit URL points at github.com. The `footer.credit_*` config fields
   already exist and stay the management surface; this is a render-only
   upgrade plus example-config copy.
2. **Quickstart strip → list** — support multiple labeled commands (Docker
   line + bare-binary line). New `branding.quickstart_commands:` list of
   `{title, command}`; the existing `quickstart_title`/`quickstart_command`
   pair keeps working as a single-entry fallback.
3. **Split hero** (templrgo style) — `hero_layout: split` renders the
   badge/heading/tagline/CTAs left-aligned with a mac-window code card on
   the right (`hero_code_title` filename bar + `hero_code` content with
   lightweight YAML tinting). Default stays `centered`; zero-config output
   unchanged.

## Analysis notes

- `footer.tsx` lines 105-118 already render prefix + linked text from
  branding; only iconography is missing.
- The quickstart strip is a single `QuickstartStrip` component with one
  copy button; generalizing to a list keeps the same visual per row.
- The split hero needs no new dependencies: window chrome is the same
  three-dot pattern used by `snapshot-code-block.tsx`, and YAML tinting is
  a ~20-line line-classifier (keys / strings / comments), acceptable
  because the input is site-owner config, not user content.

## Config surface (all optional)

```yaml
branding:
  hero_layout: split                   # centered (default) | split
  hero_code_title: "docker-compose.yaml"
  hero_code: |
    services:
      templrpress:
        image: ghcr.io/senthilsweb/templrpress:latest
        ports:
          - "5000:5000"
  quickstart_commands:
    - title: "Run with Docker"
      command: "docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest"
    - title: "Or the bare binary"
      command: "curl -L -o templrpress https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-darwin-arm64 && chmod +x templrpress && ./templrpress"

footer:
  credit_prefix: "Made with"
  credit_text: "senthilsweb"
  credit_url: "https://github.com/senthilsweb"
```

## Acceptance criteria

- [ ] Footer bottom bar shows "Made with ♥ <github-icon> senthilsweb"
  (heart red-tinted, icon only for github.com URLs), fully driven by
  `footer.credit_*`.
- [ ] Landing renders two quickstart rows (Docker + binary), each with its
  own copy button; configs with only `quickstart_command` render one row
  exactly as today.
- [ ] `hero_layout: split` shows left text + right code card matching the
  templrgo reference; `centered`/unset renders the current hero pixel-for-
  pixel; cards/showcase/footer unaffected.
- [ ] `make all` single binary; CI green.
