---
title: "Advanced configuration"
nav_title: "Advanced configuration"
slug: advanced-configuration
description: "External content overrides, theming, suppressing embedded pages, the auth stub, and other deployment-time knobs."
category: Getting Started
sort_order: 30
published: true
---

# Advanced configuration

Everything on this page is optional. The defaults serve the embedded
sample site; these knobs change where content comes from and how the site
looks — without touching code.

## External content: UNION and REPLACE

Markdown is embedded in the binary at build time, but the loader supports
two disk-override modes so content can change without a rebuild:

| Mode | Config | Behavior |
|------|--------|----------|
| UNION | `cms.source` | Disk content merges with embedded content; **embedded wins** on path collision |
| REPLACE | `cms.folders.<name>.source` | That folder is served **only** from the given path; embedded entries are ignored |

```yaml
cms:
  source: "./content"          # UNION: merge disk over embedded
  cache_ttl: "30s"             # re-scan interval for disk sources
  folders:
    docs:
      source: "./my-docs"      # REPLACE: docs come only from here
```

Special case: the **blog is always external**. The loader looks for
`./content/blog`, then `./blog`, on disk; the embedded sample post is
never served. No configuration needed.

> The old `content:` block is deprecated but still accepted — its values
> are folded into `cms:` at startup. Use `cms:` in new configs.

## Suppressing the embedded pages

To ship the binary with the docs routes wired up but none of the bundled
sample pages (a "blank canvas" for downstream forks):

```yaml
cms:
  docs_root: "docs-none"       # any folder name that has no content
```

`docs_root` selects which subfolder of `content/` feeds the docs
navigation. Pointing it at a name that does not exist yields an empty
docs site; supplying your own pages at runtime is then a REPLACE
override away:

```yaml
cms:
  folders:
    docs:
      source: "/srv/my-docs"   # your pages, no rebuild
```

The same idea applies to the landing page: every hero field, feature
card, and showcase band in `branding:` replaces the built-in copy, and
`navigation:` items with `enabled: false` disappear from the nav.

## Theming

Two independent layers:

- **Browser theme** — visitors pick a preset (sunrise, slack, navy,
  emerald, rose, indigo, mintlify, …) and dark mode from the Settings
  page; the choice is stored in that browser's localStorage. Presets are
  CSS `[data-theme]` blocks that set `--tg-primary` and friends.
- **`branding.primary_hex`** — the server-side brand color. It currently
  drives PDF link color and is the token to extend when adding
  config-driven theming.

Logos honor light/dark automatically: set `logo_url` and `logo_dark_url`
under `branding:`.

## Authentication: stubs only ("dummy" auth)

TemplrGo ships a config-driven **dummy authentication** (a single
username/password with sessions — demo-grade, not RBAC). TemplrPress
deliberately does not: the project north star excludes login flows. What
exists here:

- `/api/auth/status` always returns `{"authenticated": false}`;
  `/api/auth/logout` is a no-op. The SPA's auth-aware components degrade
  gracefully against these stubs.
- `branding.show_auth_buttons: false` hides any login/signup UI
  regardless of backend state — the right setting for a docs-only site.

Porting templrgo's dummy auth would be a deliberate scope change — an
openspec proposal, not a config flag.

## OpenAPI specs at runtime

Registered spec files resolve from the embedded filesystem first, then
from disk — so a Docker volume can add or update specs on a running
container:

```yaml
# config.yaml
openapi_specs:
  - name: myapi
    label: "My API"
    url: /static/openapi/myapi.json
```

```yaml
# docker-compose.yaml
volumes:
  - ./openapi:/app/static/openapi
```

## Hiding whole routes

```yaml
blog:
  enabled: false               # /blog returns 404, nav item hidden
api_docs:
  enabled: false               # legacy /api-docs route off
navigation:
  - label: "About"
    url: "/about"
    enabled: false             # hidden from nav (route stays reachable)
```
