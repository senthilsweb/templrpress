---
title: "Introduction"
nav_title: "Introduction"
slug: introduction
description: "What TemplrPress is — a single ~15 MB binary that serves your landing page, markdown docs, blog, and an OpenAPI explorer, all driven by one YAML file."
category: Getting Started
sort_order: 1
published: true
---

# Introduction

**TemplrPress** is a publishing platform that ships as one binary, around
15 MB. You point it at a folder of markdown and one YAML file, and it
serves a landing page, a docs site, a blog, and a REST API explorer for
any OpenAPI spec. No Node at runtime, no database, no build step on the
server.

*"Why would I run a binary when I can deploy a static site or a headless
CMS?"*

Because most small product and internal sites need all four surfaces —
landing, docs, blog, API reference — and today that usually means a static
site generator, a separate API-docs tool, and a pipeline to glue them.
TemplrPress collapses that into `./templrpress -f config.yaml`. The same
binary runs on a laptop, in Docker, or on a bare VM behind a reverse proxy.

## What you get

| Surface | What it does | Where it comes from |
|---------|--------------|---------------------|
| Landing page | Hero, quickstart command strip, feature cards (tinted or gradient), showcase bands | `branding:` block in YAML |
| Docs | Three-column layout: section sidebar, content, table of contents with scroll-tracking | `content/docs/` markdown |
| Blog | Listing plus article pages | `content/blog/` markdown |
| API explorer | Multi-spec OpenAPI viewer with cURL / JavaScript / Python samples and a Try It runner | `openapi_specs:` entries |
| JSON API | Everything above is served as JSON (`/api/cms/...`, `/api/config/...`) for any other client | built in |

*[Screenshot: landing page — hero with quickstart strip and gradient feature cards]*

## How it works (the 60-second tour)

A Go server embeds three things at compile time via `go:embed`: the
markdown under `content/`, the static assets under `static/`, and a
pre-built Next.js SPA. At runtime the server renders markdown with
goldmark, exposes it through a small JSON API, and the SPA consumes that
API for every page.

```
content/*.md ──▶ Go server (goldmark + JSON API) ──▶ embedded SPA ──▶ browser
                        ▲
                  config.yaml
```

Because everything is compiled in, a deployment is one file. Because
everything is read from config and content at startup, changing the site
never means touching code.

## Configurable, not customizable-by-code

One YAML file drives the site. The important blocks:

- **`site:`** — name, title, description.
- **`branding:`** — logo, primary color (`primary_hex`), hero copy and
  CTAs, quickstart command, feature cards, showcase bands.
- **`navigation:`** — top nav items, including flyout menus with children,
  multi-column layouts, and a themed footer band.
- **`cms:`** — where markdown lives (see below).
- **`openapi_specs:`** — the specs the API explorer offers.

Generate a starter file and edit it:

```bash
./templrpress init -o config.yaml
```

## Docs embedded or served external

Markdown is embedded in the binary by default, but you do not have to
rebuild to change content. Two override modes:

| Mode | Config | Behavior |
|------|--------|----------|
| UNION | `cms.source: /path/to/content` | Disk content is merged with embedded content; embedded wins on collision |
| REPLACE | `cms.folders.docs.source: /path/to/docs` | That folder is served only from disk; embedded entries are ignored |

The same applies to OpenAPI specs: a spec file volume-mounted under
`static/openapi/` is picked up without rebuilding.

## REST API explorer for any OpenAPI spec

Register any OpenAPI 3.x document and the explorer renders it: endpoints
grouped by tag, request/response tables, generated cURL, JavaScript, and
Python examples, plus a Try It panel that sends real requests. Multiple
specs appear in a dropdown; per-spec base-URL overrides and global headers
are stored in the browser only.

```yaml
openapi_specs:
  - name: petstore
    label: "Swagger Petstore"
    url: /static/openapi/petstore.json
```

*[Screenshot: API explorer — endpoint detail with code examples column]*

## Run it now

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Open <http://localhost:5000>, then continue with
[Installation](/docs/installation) and [Quickstart](/docs/quickstart).
