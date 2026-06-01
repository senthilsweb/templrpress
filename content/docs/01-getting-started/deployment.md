---
title: Deployment
slug: deployment
description: Run TemplrPress as a single binary or Docker container.
category: Getting Started
sort_order: 40
published: true
---

# Deployment

## Single binary

```bash
go build -o templrpress
./templrpress serve -f config.yaml
```

The binary embeds templates and default content. To override content from
disk, set `content.source` in `config.yaml`.

## Docker

```bash
docker run --rm -p 3000:3000 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/content:/app/content \
  ghcr.io/senthilsweb/templrpress:latest
```

To serve custom OpenAPI spec files without rebuilding the image, add an
`openapi` volume that lands at `/app/static/openapi/`:

```bash
docker run --rm -p 3000:3000 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/content:/app/content \
  -v $(pwd)/openapi:/app/static/openapi \
  ghcr.io/senthilsweb/templrpress:latest
```

## docker-compose

```yaml
services:
  templrpress:
    image: ghcr.io/senthilsweb/templrpress:latest
    ports: ["3000:3000"]
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ./content:/app/content:ro
      - ./openapi:/app/static/openapi:ro  # optional — custom OpenAPI specs
```

## GitHub Actions

The included workflow at `.github/workflows/docker.yml` builds and publishes a
multi-arch image to GHCR on every push to `main` and on tags matching `v*`.
