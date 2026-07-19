---
title: "UI Refresh — Gradient Landing, Flyout Menus, and a Wider API View"
slug: ui-refresh-gradient-landing-flyout
description: The next TemplrPress release reworks the landing page with gradient CTA cards and showcase bands, enables config-driven flyout menus, and fixes the API page layout.
date: 2026-07-18T00:00:00Z
published: true
type: blog
category: Announcements
author: Senthilnathan (senthilsweb)
sort_order: 40
tags: [release, ui, landing-page, navigation, openapi, tailwind]
---

# UI Refresh — Gradient Landing, Flyout Menus, and a Wider API View

The next TemplrPress release is a UI pass across three surfaces: the
landing page, the top navigation, and the API explorer. Everything below
is on the main branch now and ships with the next tag. All of it is
config-driven; none of it adds a dependency.

## What's in the refresh

| Area | Change |
|------|--------|
| Landing | `features_style: gradient` — bold gradient cards with per-card CTA buttons, five presets (violet, rose, amber, teal, navy) |
| Landing | `showcase:` — alternating text/visual bands below the cards |
| Landing | Quickstart strip: one copyable command under the hero CTAs |
| Navigation | Flyout menus from YAML: `children:` for dropdowns, `columns:` for multi-column, `footer:` for a themed band |
| API page | Columns split 3:2 with a full-height divider; the code column grows into what used to be dead space |
| Drawers | All drawer forms follow one written standard (`openspec/ui-page-standard.md`) |

*[Screenshot: landing page — three gradient cards above the fold at 1080p]*

## Gradient cards in 8 lines of YAML

```yaml
branding:
  features_style: gradient
  features:
    - title: "API Explorer"
      description: "Multi-spec OpenAPI viewer with a Try It button."
      url: "/rest-api-spec"
      cta_text: "Open the explorer"
      gradient: rose
```

Omit `features` entirely and the built-in cards render — existing configs
keep working unchanged.

## Flyout menus were always half-there

The SPA carried a complete flyout renderer from day one — single-column
with icons and subtitles, multi-column with headings, a themed footer
band. What was missing sat on the Go side: the branding handler flattened
navigation to label, URL, and icon, silently dropping any `children:` in
the YAML. The bridge now emits the full tree, so this:

```yaml
navigation:
  - label: "Resources"
    children:
      - label: "Quickstart"
        url: "/docs/quickstart"
        icon: "zap"
        subtitle: "Running in under a minute"
```

renders a proper flyout with no SPA change at all.

## One honest aside

A docs search pill shipped briefly during this refresh and was removed in
the same branch. The drawer it opened only matched page titles — real
search needs an index, and a search box that cannot search page content
is worse than no search box. It will come back when it can do the real
thing.

## What's next

- Docs search, done properly.
- Showcase bands need sample imagery in the demo config.
- Split hero layout (`hero_layout: split` with a product screenshot) is
  designed but not built.

## Try it

```bash
git clone https://github.com/senthilsweb/templrpress && cd templrpress
make all && ./bin/templrpress -f config.example.yaml
```

— Senthil

## Related reading

- **[Introducing TemplrPress](/blog/introducing-templrpress)** — the platform overview.
- **[An API explorer for any OpenAPI spec](/blog/api-explorer-any-openapi-spec)** — the layout fix in context.
