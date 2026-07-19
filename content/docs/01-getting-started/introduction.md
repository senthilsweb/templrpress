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

## Where this came from

TemplrPress is not a new idea — it is the fifth year of one. It started
in 2021 as [**Zypress**](https://github.com/senthilsweb/zypress), a
Vue.js Jamstack framework built with NuxtJS, Tailwind CSS, and
`@nuxt/content`, preloaded with a personal-website and documentation
starter kit for blog and docs sites. Over the years I moved the same
idea into a Go binary and kept enhancing it gradually. The UI takes its
inspiration from **Mintlify**; the docs and blog schema take theirs
from **MkDocs**.

Both are great tools, MkDocs especially, and there is plenty of good
open source in this space. But none of it gave me markdown docs and an
OpenAPI reference together without a paid license or a setup that was
slightly difficult. I also had needs no general tool covers: my own
rendering (pipeline and architecture diagrams), a headless JSON API so
the same content can be consumed by other clients, and PDF export out
of the box — all from one binary.

So TemplrPress is **highly opinionated** — it works the way my
requirements work. My own blog runs on this codebase, and it is also
where the documentation for my other open-source projects will live. If
you need a product website, docs, and blog together, it may fit you too.

## What you get

| Surface | What it does | Where it comes from |
|---------|--------------|---------------------|
| Landing page | Hero, quickstart command strip, feature cards (tinted or gradient), showcase bands | `branding:` block in YAML |
| Docs | Three-column layout: section sidebar, content, table of contents with scroll-tracking | `content/docs/` markdown |
| Blog | Listing plus article pages | `content/blog/` markdown |
| API explorer | Multi-spec OpenAPI viewer with cURL / JavaScript / Python samples and a Try It runner | `openapi_specs:` entries |
| JSON API | Everything above is served as JSON (`/api/cms/...`, `/api/config/...`) for any other client | built in |

*[Screenshot: landing page — hero with quickstart strip and gradient feature cards]*

## Features

**Publishing surfaces**

- **Landing page from YAML** — hero, quickstart command strip,
  tinted/gradient feature cards, showcase bands; no code changes to
  redesign.
- **Docs site** — three-column layout with section sidebar,
  scroll-tracked table of contents, ordering via `sort_order`.
- **Blog** — listing plus article pages from `content/blog/` markdown.
- **REST API explorer** — any OpenAPI 3.x spec: endpoints grouped by
  tag, generated cURL / JavaScript / Python samples, a Try It runner,
  a multi-spec dropdown, and per-spec base-URL overrides stored in the
  browser only.
- **Article PDF export** — pure Go (goldmark-pdf); no headless browser,
  no wkhtmltopdf.

**Content and authoring**

- **Markdown-first authoring** — goldmark rendering, YAML frontmatter,
  syntax highlighting.
- **Diagrams in markdown** — Mermaid and React Flow-based architecture
  and pipeline diagrams.
- **Embedded or external content** — content compiles into the binary,
  but disk overrides can merge with or replace embedded pages per
  folder without a rebuild; volume-mounted OpenAPI specs work the same
  way.

**Platform and operations**

- **One ~15 MB binary** — Go plus an embedded Next.js static export; no
  Node at runtime, no database, no server-side build step.
- **One YAML config file** — site, branding, navigation (flyout menus,
  multi-column), footer, specs; `./templrpress init` scaffolds it.
- **Theming** — primary color via `primary_hex`, named theme palettes,
  dark/light mode.
- **Headless JSON API** — everything the SPA renders is also served as
  JSON (`/api/cms/...`, `/api/config/...`) for any other client.
- **Multi-arch Docker images** — `linux/amd64` + `arm64` published to
  ghcr.io on every push to `main`; also runs as a bare binary on macOS
  and Linux.
- **Share-ready links** — the server injects Open Graph and Twitter
  card tags per page (title, description, canonical URL, cover image
  from frontmatter), so a blog or docs link pasted into WhatsApp,
  iMessage, Slack, or email shows the real article preview, not a
  generic SPA shell.

**AI and automation**

- **Continuously regenerated knowledge graph** — CI commits
  `graph.json` (NetworkX node-link, loadable by TemplrGo's explorer)
  and a ≤50 KB `graph-index.json` to the repo root on every code push.
- **LLM-friendly site and repo** — the server publishes `/llms.txt`
  (a plain-markdown site map of every docs and blog page, per
  llmstxt.org) for LLM crawlers, and the repo's root `CLAUDE.md` +
  `AGENTS.md` point coding agents at the graph index first, saving
  context tokens.
- **Spec-driven development** — every non-trivial change ships as an
  OpenSpec proposal, design, and task breakdown before code.

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
rebuild to change content: disk overrides can merge with or replace the
embedded pages per folder, and OpenAPI spec files volume-mounted under
`static/openapi/` are picked up the same way. The exact rules live in
[Advanced configuration](/docs/advanced-configuration).

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
[Getting Started](/docs/getting-started) and
[Authoring content](/docs/authoring).
