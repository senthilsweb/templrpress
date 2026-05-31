---
title: Branding & theming
slug: branding
description: Configure the app name, logos, favicon, and theme tokens.
category: Getting Started
sort_order: 20
published: true
---

# Branding & theming

TemplrPress branding lives entirely in `config.yaml` under the `branding` block.
No code changes are needed — edit, save, restart, refresh.

## Minimal example

```yaml
branding:
  app_name: "TemplrPress"
  tagline: "A single-binary markdown publishing platform"
  logo_light: "/static/logo-light.svg"
  logo_dark:  "/static/logo-dark.svg"
  favicon:    "/static/favicon.ico"
  navigation:
    - label: "Docs"
      url:   "/docs"
    - label: "API"
      url:   "/rest-api-spec"
    - label: "GitHub"
      url:   "https://github.com/senthilsweb/templrpress"
      external: true
  footer:
    copyright: "© {year} TemplrPress"
    credit:    "Built on TemplrPress"
```

## Logos and favicon

Drop SVG/PNG/ICO assets into `static/` and reference them with `/static/<name>`.
Files are embedded into the binary at build time. For light/dark pairs, supply
both `logo_light` and `logo_dark`; the SPA picks based on the active theme.

## Theme tokens

The SPA exposes seven palettes (navy, slate, emerald, rose, amber, violet,
zinc). Set the default in `config.yaml`:

```yaml
ui:
  default_theme: "navy"      # one of: navy slate emerald rose amber violet zinc
  allow_user_switch: true
```

Custom palettes are not supported in v0.2.x — fork the SPA if you need a brand
colour outside the seven presets.

## Navigation

Each entry under `branding.navigation` becomes a top-level link. `external: true`
opens the link in a new tab and adds an icon. Children for dropdown menus are
not yet supported in TemplrPress (use a flat nav).
