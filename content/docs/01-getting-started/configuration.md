---
title: Configuration
slug: configuration
description: Every knob in config.yaml.
category: Getting Started
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

## Environment variables

A handful of environment variables override CLI flags and the config-file
search path. They are read once at startup; there is no `.env` file loader.

| Variable             | Effect                                                | Default |
|----------------------|-------------------------------------------------------|---------|
| `TEMPLRPRESS_CONFIG` | Absolute path to a `config.yaml` to load.             | _unset — falls back to `--config` flag, then built-in defaults_ |
| `TEMPLRPRESS_PORT`   | TCP port to bind. Overridden by `--port`/`-p` if set. | `5000`  |
| `TEMPLRPRESS_HOST`   | Host/interface to bind. Overridden by `--host`.       | `0.0.0.0` |

Precedence (highest wins): CLI flag → env var → config file → built-in default.

```bash
TEMPLRPRESS_PORT=9090 TEMPLRPRESS_CONFIG=/etc/templrpress/config.yaml \
  ./templrpress
```

## Logging

TemplrPress writes plain-text lines to **stdout** — there is no log file, no
log rotation, no structured logger. Two kinds of lines are produced:

```
templrpress 0.2.1 — config: /etc/templrpress/config.yaml
listening on http://0.0.0.0:9898
19:11:30 GET  /api/cms/list           (1.2ms)
19:11:30 GET  /docs/installation      (842µs)
```

- A startup banner with version and active config source.
- One access-log line per request: `HH:MM:SS METHOD PATH (duration)`.

Capture them with whatever you already use — `journalctl`, `docker logs`, a
pipe to `logger`, redirection to a file (`./templrpress >> /var/log/tp.log`),
etc. There are no log-level knobs in v0.2.x.
