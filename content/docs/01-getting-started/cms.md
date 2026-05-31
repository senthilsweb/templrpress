---
title: CMS & content folders
slug: cms
description: How TemplrPress turns markdown folders into routed pages.
category: Getting Started
sort_order: 30
published: true
---

# CMS & content folders

TemplrPress is a thin CMS: every markdown file under `content/` becomes a
routed page. There is no database — the filesystem (or the embedded snapshot)
is the source of truth.

## Folder layout

```
content/
├── docs/                       # rendered at /docs/<slug>
│   ├── 01-getting-started/
│   │   ├── welcome.md
│   │   └── quickstart.md
│   └── 02-guides/
│       ├── configuration.md
│       └── branding.md
└── blog/                       # optional — rendered at /blog/<slug>
    └── 2026-04-launch.md
```

Numeric prefixes (`01-`, `02-`) only control sidebar ordering and are stripped
from the URL. The visible URL is driven by the `slug` field in frontmatter.

## Required frontmatter

```yaml
---
title: "Page title"          # required — shown in sidebar and <h1>
slug: "my-page"              # required — final URL segment
description: "One-liner."    # optional — shown in lists and <meta>
category: "Guides"           # optional — groups pages in the sidebar
sort_order: 20               # optional — lower = earlier (defaults to 999)
published: true              # required — false hides the page
---
```

Pages with `published: false` are skipped at index time and return 404.

## Embedded vs. live content

By default `content/` is **embedded** at build time via `go:embed`. To edit
markdown without rebuilding, point `content.source` at a real path:

```yaml
content:
  source: "./content"        # live filesystem (dev mode)
  # source: ""               # use embedded snapshot (default)
```

## Suppressing the bundled docs

Ship a binary that has the doc routes wired up but no default content (e.g. for
a downstream fork that supplies its own docs at runtime):

```yaml
content:
  docs_root: "docs-empty"    # use content/docs-empty/ instead of content/docs/
```

The repository ships a `content/docs-empty/` skeleton with the same folder
shape as `content/docs/` but empty (`.gitkeep` only). Switch to it whenever you
want a "blank canvas" build.
