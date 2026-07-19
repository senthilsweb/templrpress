---
title: "An API Explorer for Any OpenAPI Spec"
slug: api-explorer-any-openapi-spec
description: Register any OpenAPI 3.x document in YAML and get endpoint pages, cURL/JavaScript/Python samples, and a Try It runner — no Swagger UI, no CDN.
date: 2026-07-18T00:00:00Z
published: true
type: blog
category: Engineering
author: Senthilnathan (senthilsweb)
sort_order: 30
tags: [openapi, rest-api, api-docs, try-it, swagger-alternative]
---

# An API Explorer for Any OpenAPI Spec

Give TemplrPress an OpenAPI 3.x document and it renders a full API
reference: endpoints grouped by tag, request and response tables,
generated code samples in three languages, and a Try It panel that sends
real requests. The bundled Petstore demo renders 19 endpoints this way.

## Why?

*"Why not just embed Swagger UI?"*

Swagger UI is a separate look, a separate theme, and usually a CDN
dependency. TemplrPress renders specs with the same SPA that renders the
docs and the blog — same typography, same dark mode, same primary color
from `primary_hex`, and zero runtime fetches to third parties. The strict
goal is one self-contained binary.

## Registering a spec

```yaml
openapi_specs:
  - name: petstore
    label: "Swagger Petstore"
    url: /static/openapi/petstore.json
```

Multiple entries appear in a dropdown in the left sidebar. Each spec file
is read from the embedded filesystem first, then from disk — so a Docker
volume mounted at `/app/static/openapi/` can add or update specs on a
running container.

## What a page gives you

| Element | Detail |
|---------|--------|
| Endpoint list | Grouped by tag, with endpoint counts and search |
| Request body table | Field, type, required marker, description |
| Responses | Status-badged rows straight from the spec |
| Code examples | cURL, JavaScript, Python, generated per endpoint |
| Try It | Sends the request from the browser with your values |
| Spec settings | Per-spec base URL override and global headers, stored in localStorage only |

*[Screenshot: API explorer — endpoint detail with full-height divider and code column]*

## One honest aside

The three-column layout had a divider bug for a while: the vertical rule
between the endpoint detail and the code column was a `border-l` on the
code panel itself — a sticky, self-scrolling element whose height matched
its content. Short code sample, short divider: the line just stopped
mid-page. The fix moved the border to a stretched wrapper and split the
row 3:2, so the code column now fills the space and the divider runs the
full height.

## What's next

- Auth-aware Try It presets (per-spec headers exist today; auth flows do
  not).
- OpenAPI 3.1 edge cases — `webhooks` are not rendered yet.

## Try it

```bash
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest
# open http://localhost:5000/rest-api-spec
```

— Senthil

## Related reading

- **[Introducing TemplrPress](/blog/introducing-templrpress)** — the platform overview.
- **[Docs, embedded or external](/blog/docs-embedded-or-external)** — the disk-fallback mechanics behind volume-mounted specs.
