---
title: Installation
slug: installation
description: Install TemplrPress on Linux, macOS, or Windows — single binary, no dependencies.
category: Getting Started
sort_order: 1
published: true
---

# Installation

TemplrPress is shipped as a single statically-linked binary. There is no
runtime dependency — no Node, no database, no external services. Pick the
method that matches your environment.

## 1. Pre-built binary

Download the binary for your platform from the
[GitHub releases page](https://github.com/senthilsweb/templrpress/releases)
and drop it onto your `$PATH`.

```bash
# macOS (arm64)
curl -L -o templrpress \
  https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-darwin-arm64
chmod +x templrpress
./templrpress -p 9898
```

```bash
# Linux (amd64)
curl -L -o templrpress \
  https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-linux-amd64
chmod +x templrpress
./templrpress -p 9898
```

## 2. Docker

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Mount your own `config.yaml` and content folder if you want runtime overrides:

```bash
docker run --rm -p 5000:5000 \
  -v $PWD/config.yaml:/app/config.yaml:ro \
  -v $PWD/content:/app/content:ro \
  ghcr.io/senthilsweb/templrpress:latest
```

## 3. Build from source

Requires Go 1.21+ and Node 20+ (only at build time):

```bash
git clone https://github.com/senthilsweb/templrpress
cd templrpress
make all          # tidy, npm run build, go build → bin/templrpress
./bin/templrpress -p 9898
```

`make all` produces a ~12 MB binary that embeds the SPA (`templrpress-nextjs/out`),
the `static/` and `content/` directories, and the example config.

## Verify

```bash
curl http://localhost:9898/healthz
# {"status":"ok","version":"0.2.x","time":"..."}
```

Open <http://localhost:9898> — the Docs, API and About tabs should all render.

## What ships in the binary

| Asset                          | Source                              |
|--------------------------------|-------------------------------------|
| Single-page application        | `templrpress-nextjs/out/` (Next.js export) |
| Static assets (logos, OpenAPI) | `static/`                           |
| Default markdown content       | `content/`                          |
| Default config                 | `config.example.yaml`               |

Everything is embedded via `go:embed`. The binary has no runtime dependency on
any of these directories — they only matter at build time.

## Next steps

- [Quickstart](/docs/quickstart) — run a site in under a minute.
- [Configuration](/docs/configuration) — every knob in `config.yaml`, plus
  environment variables and CLI flags.
- [Deployment](/docs/deployment) — systemd, Docker Compose, and reverse-proxy
  recipes.
