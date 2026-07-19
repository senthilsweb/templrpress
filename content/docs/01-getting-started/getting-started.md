---
title: "Getting Started"
nav_title: "Getting Started"
slug: getting-started
description: "Install TemplrPress, run it, and understand the one YAML file that drives everything — in one page."
category: Getting Started
sort_order: 2
published: true
---

# Getting Started

One binary, one YAML file, one folder of markdown. This page takes you
from nothing to a running, configured site.

## Run it

Pick one of three ways. Docker is the fastest:

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Or download a pre-built binary and drop it on your `$PATH`:

```bash
# macOS (arm64)
curl -L -o templrpress \
  https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-darwin-arm64
chmod +x templrpress
./templrpress -p 9898

# Linux (amd64)
curl -L -o templrpress \
  https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-linux-amd64
chmod +x templrpress
./templrpress -p 9898
```

Or build from source (Go 1.21+ and Node 20+ needed at build time only):

```bash
git clone https://github.com/senthilsweb/templrpress
cd templrpress
make all                      # tidy + SPA build + go build → bin/templrpress
./bin/templrpress -p 9898
```

## Verify

```bash
curl http://localhost:9898/healthz
# {"status":"ok","version":"...","time":"..."}
```

Open <http://localhost:9898> — the landing page, Docs, and API tabs should
all render from the embedded sample content.

## What ships in the binary

| Asset | Source |
|-------|--------|
| Single-page application | `templrpress-nextjs/out/` (Next.js static export) |
| Static assets (logos, OpenAPI specs) | `static/` |
| Default markdown content | `content/` |
| Default config | `config.example.yaml` |

Everything is embedded via `go:embed`; the binary has no runtime
dependency on any of these directories.

## The config file

Generate a starter and pass it with `-f`:

```bash
./templrpress init -o config.yaml
./templrpress -f config.yaml
```

Top-level sections:

| Section | Purpose |
|---------|---------|
| `site` | Name, page title, meta description. |
| `server` | Host and port to bind. |
| `branding` | Logo, primary color, hero copy, quickstart strip, feature cards, showcase bands. |
| `cms` | Where markdown lives, per-folder overrides — see [Advanced configuration](/docs/advanced-configuration). |
| `blog` | Enable/disable `/blog`, page size. |
| `api_docs` | Enable/disable the API docs route. |
| `openapi_specs` | Specs offered by the API explorer. |
| `footer` | CTA band, link columns, credit line. |
| `navigation` | Top-nav items, including flyout menus. |

## Make it yours

1. Replace files under `content/docs/` with your markdown — frontmatter
   conventions are in [Authoring content](/docs/authoring).
2. Edit `config.yaml`: branding, navigation, footer
   (see [Branding](/docs/branding)).
3. Either restart the binary with `cms.source` pointed at your content
   folder, or run `make all` to embed everything into a fresh binary —
   the difference is explained in
   [Advanced configuration](/docs/advanced-configuration).

## Environment variables and flags

Precedence, highest wins: **CLI flag → env var → config file → built-in
default**.

| Variable | Effect | Default |
|----------|--------|---------|
| `TEMPLRPRESS_CONFIG` | Path to a `config.yaml` to load. | unset |
| `TEMPLRPRESS_PORT` | TCP port (overridden by `-p`). | `5000` |
| `TEMPLRPRESS_HOST` | Bind interface (overridden by `-H`). | `0.0.0.0` |

```bash
TEMPLRPRESS_PORT=9090 TEMPLRPRESS_CONFIG=/etc/templrpress/config.yaml \
  ./templrpress
```

## Logging

Plain-text lines on **stdout** only — a startup banner, then one access
line per request (`HH:MM:SS METHOD PATH (duration)`). No log files, no
levels; capture with `journalctl`, `docker logs`, or redirection.

## Next steps

- [Authoring content](/docs/authoring) — folders, frontmatter, markdown features.
- [Advanced configuration](/docs/advanced-configuration) — external content, theming, suppressing embedded pages.
- [Deployment](/docs/deployment) — systemd, Docker Compose, reverse proxies.
