---
title: Quickstart
slug: quickstart
description: Run TemplrPress in under a minute.
category: Getting Started
sort_order: 5
published: true
---

# Quickstart

TemplrPress is a single binary. The fastest way to see it run is:

## Docker

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Open <http://localhost:5000>. The bundled SPA, sample docs, and OpenAPI viewer
are served straight from the container — no volumes, no Node, no database.

## Local binary

```bash
# clone and build
git clone https://github.com/senthilsweb/templrpress
cd templrpress
make all                      # tidy + npm run build + go build
./bin/templrpress -p 9898     # http://localhost:9898
```

## Author your own site

1. Replace files under `content/docs/` with your markdown — each `.md` needs the
   frontmatter shown in [Authoring content](/docs/authoring).
2. Edit `config.yaml` to update branding, navigation, and footer (see
   [Configuration](/docs/configuration) and [Branding](/docs/branding)).
3. Run `make all` to embed everything into a fresh binary.

That's it — one binary, one config, one folder of markdown.
