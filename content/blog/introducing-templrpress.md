---
title: "Introducing TemplrPress — a Publishing Platform in One Binary"
slug: introducing-templrpress
description: One ~15 MB binary serves your landing page, docs, blog, and an OpenAPI explorer — driven by a single YAML file, no database, no build step.
date: 2026-07-18T00:00:00Z
published: true
type: blog
category: Announcements
author: Senthilnathan (senthilsweb)
sort_order: 10
tags: [announcement, golang, nextjs, markdown, single-binary, cms]
---

# Introducing TemplrPress — a Publishing Platform in One Binary

**TemplrPress** is one binary, about 15 MB. It serves a landing page, a
docs site, a blog, and a REST API explorer for any OpenAPI spec. You give
it a folder of markdown and one YAML file. That is the whole deployment.

## Why?

*"Why another publishing tool when static site generators already work?"*

Because a small product site usually needs four surfaces — landing, docs,
blog, API reference — and that usually means one static site generator,
one API-docs tool, and a CI pipeline to stitch them. Each tool has its own
config, its own theme, its own deploy. TemplrPress collapses all of it
into:

```bash
./templrpress -f config.yaml
```

The same binary runs on a laptop, in Docker, or behind a reverse proxy on
a bare VM. There is no Node on the server, no database, and no build step
after content changes.

## What is inside

| Surface | Source |
|---------|--------|
| Landing page (hero, quickstart strip, feature cards) | `branding:` block in YAML |
| Docs with sidebar, table of contents, scroll-tracking | `content/docs/*.md` |
| Blog | `content/blog/*.md` |
| API explorer with cURL / JavaScript / Python samples | `openapi_specs:` entries |
| JSON API for all of the above | built in |

The trick is `go:embed`: a Go server compiles in the markdown, the static
assets, and a pre-built **Next.js SPA**. At runtime the server renders
markdown with goldmark and exposes a small JSON API; the SPA consumes that
API for every page.

*[Screenshot: landing page — hero with quickstart strip and gradient feature cards]*

## One honest aside

The first embedded build shipped with a leftover from its parent project:
the spec-settings drawer told users their tokens are "never sent to the
**TemplrGo** backend" — inside TemplrPress. Copy is content too; it now
reads the app name from the branding config like everything else.

## What's next

- Docs search (title matching first, full-text later).
- More landing sections driven purely by config.
- Not planned: databases, auth, background workers. The project stays
  deliberately small.

## Try it

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
```

Open <http://localhost:5000>.

— Senthil

## Related reading

- **[Docs, embedded or external](/blog/docs-embedded-or-external)** — how the same binary serves compiled-in and volume-mounted content.
- **[An API explorer for any OpenAPI spec](/blog/api-explorer-any-openapi-spec)** — the REST viewer walkthrough.
