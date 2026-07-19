---
title: "Authoring content"
nav_title: "Authoring content"
slug: authoring
description: "Folders, frontmatter, and markdown features — how markdown files become routed pages."
category: Getting Started
sort_order: 10
published: true
---

# Authoring content

TemplrPress is a thin CMS: every markdown file under `content/` becomes a
routed page. There is no database — the filesystem (or the embedded
snapshot) is the source of truth.

## Folder layout

```
content/
├── about.md                    # /about
├── docs/                       # /docs?slug=<slug>
│   ├── 01-getting-started/
│   │   ├── introduction.md
│   │   └── authoring.md
│   └── 02-guides/
│       └── your-page.md
└── blog/                       # /blog?slug=<slug>
    └── hello-world.md
```

- Subfolders of `content/docs/` become sidebar **sections**; the numeric
  prefix (`01-`, `02-`) controls section order and is stripped from the
  label.
- The URL is driven by the `slug` frontmatter field, never the file path.
- The blog folder is **always read from disk** (`./content/blog`, then
  `./blog`) — posts update without a rebuild. See
  [Advanced configuration](/docs/advanced-configuration) for the
  embedded-vs-disk rules for everything else.

## Frontmatter

Every markdown file starts with a YAML block:

```yaml
---
title: "Page title"          # required — sidebar label and <h1>
slug: "my-page"              # recommended — URL segment; defaults to file basename
nav_title: "Short label"     # optional — overrides title in the sidebar
description: "One-liner."    # optional — shown in lists and <meta>
category: "Guides"           # optional — groups pages in the sidebar
sort_order: 20               # optional — lower = earlier; 0 means unset (sorts last)
date: 2026-01-15             # optional — ISO date or RFC3339 (blog uses it)
author: "Your Name"          # optional — shown on blog articles
tags: [tag1, tag2]           # optional — shown as chips on blog cards
published: true              # optional — defaults true; false hides the page (404)
---
```

Two gotchas worth knowing:

- `sort_order: 0` is treated as *unset* (Go's zero value) and sorts
  **last**, not first. Start numbering at 1.
- Pages with `published: false` are skipped at index time — they do not
  appear in navigation and their URLs return 404.

## Markdown features

GitHub-flavoured markdown via [goldmark](https://github.com/yuin/goldmark):
tables, task lists, footnotes, strikethrough, autolinks, and fenced code
blocks with syntax highlighting. Heading IDs are generated automatically,
so the docs table of contents and deep links work with no extra markup.

## PDF export

Every docs and blog article can be downloaded as a PDF from the icon in
the article header — rendered server-side from the same markdown by the
binary itself, no extra tooling:

```
GET /api/cms/pdf/{folder}/{slug}     # e.g. /api/cms/pdf/docs/authoring
```
