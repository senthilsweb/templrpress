---
title: About TemplrPress
date: 2026-07-19T00:00:00Z
description: "What TemplrPress is — a single ~15 MB binary that serves your landing page, markdown docs, blog, and an OpenAPI explorer, all driven by one YAML file."
---

# About TemplrPress

**TemplrPress** is a publishing platform that ships as one binary, around
15 MB. You point it at a folder of markdown and one YAML file, and it
serves a landing page, a docs site, a blog, and a REST API explorer for
any OpenAPI spec. No Node at runtime, no database, no build step on the
server.

Most small product and internal sites need all four surfaces — landing,
docs, blog, API reference — and today that usually means a static site
generator, a separate API-docs tool, and a pipeline to glue them.
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
| Landing page | Hero (centered or split with a code card), quickstart command strips, feature cards, showcase bands | `branding:` block in YAML |
| Docs | Three-column layout: section sidebar, content, table of contents with scroll-tracking | `content/docs/` markdown |
| Blog | Listing plus article pages | `content/blog/` markdown |
| API explorer | Multi-spec OpenAPI viewer with cURL / JavaScript / Python samples and a Try It runner | `openapi_specs:` entries |
| PDF export | Any docs or blog article as a PDF, rendered server-side in pure Go | built in |
| JSON API | Everything above is served as JSON (`/api/cms/...`, `/api/config/...`) for any other client | built in |

## How it works

A Go server embeds three things at compile time via `go:embed`: the
markdown under `content/`, the static assets under `static/`, and a
pre-built Next.js SPA. At runtime the server renders markdown with
goldmark, exposes it through a small JSON API, and the SPA consumes that
API for every page.

Because everything is compiled in, a deployment is one file. Because
everything is read from config and content at startup, changing the site
never means touching code. Content can also live outside the binary:
disk overrides merge with or replace embedded pages per folder, and the
blog is always read from disk — posts publish without a rebuild.

## Stack

- Go + `net/http`, [goldmark](https://github.com/yuin/goldmark) markdown,
  `yaml.v3` config
- Next.js 16 / React 19 SPA (TypeScript, Tailwind 4, shadcn/ui), static-
  exported and embedded
- [goldmark-pdf](https://github.com/stephenafamo/goldmark-pdf) for pure-Go
  PDF export
- Multi-arch Docker images (`linux/amd64` + `arm64`) on ghcr.io

## Try it

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Then read the [Introduction](/docs?slug=introduction) in the docs, or
browse the [source on GitHub](https://github.com/senthilsweb/templrpress).
