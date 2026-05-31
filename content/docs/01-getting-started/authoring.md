---
title: Authoring content
slug: authoring
description: Markdown frontmatter and folder conventions.
category: Getting Started
sort_order: 25
published: true
---

# Authoring content

## Folders

```
content/
├── about.md             # /about
├── docs/
│   ├── 01-getting-started/
│   │   └── welcome.md   # /docs/welcome
│   └── 02-guides/
│       └── configuration.md
└── blog/
    └── hello-world.md   # /blog/hello-world
```

Numbered folder prefixes (`01-`, `02-`) control sidebar grouping order in docs.

## Frontmatter

Every markdown file should start with a YAML block:

```yaml
---
title: Page title
slug: my-page                # optional; defaults to file basename
description: Short summary
category: Guides             # used as section label
sort_order: 10               # lower = earlier in the sidebar
date: 2026-01-15             # ISO date or RFC3339
published: true              # set false to hide
author: Your Name
tags: [tag1, tag2]
---
```

## Markdown features

GitHub-flavoured markdown is supported via [goldmark](https://github.com/yuin/goldmark):
tables, task lists, footnotes, strikethrough, autolinks, and fenced code blocks.
