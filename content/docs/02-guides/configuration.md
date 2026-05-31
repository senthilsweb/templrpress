---
title: Configuration
slug: configuration
description: Every knob in config.yaml.
category: Guides
sort_order: 10
published: true
---

# Configuration

Everything is driven by one YAML file. Generate a starter:

```bash
./templrpress init -o config.yaml
```

## Top-level sections

| Section      | Purpose |
|--------------|---------|
| `site`       | Name, page title, meta description, canonical URL. |
| `server`     | Host + port to bind. |
| `branding`   | Logo text/image, hero copy, primary colour. |
| `content`    | External markdown directory + folder names. |
| `blog`       | Enable/disable `/blog`, page size. |
| `api_docs`   | Enable/disable `/api-docs`, spec URL. |
| `footer`     | CTA band + credit line. |
| `navigation` | Top-nav items (with optional dropdowns). |

## External content

By default, content is read from the binary's embedded `content/` folder.
Point `content.source` at a directory on disk to override:

```yaml
content:
  source: "./content"
```

When `content.source` is set, edits show up immediately (no cache).

## Hide the blog

Set both flags:

```yaml
blog:
  enabled: false
navigation:
  - label: "Blog"
    url: "/blog"
    enabled: false
```
