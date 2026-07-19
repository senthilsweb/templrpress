---
title: "Docs, Embedded or External — One Binary, Two Content Modes"
slug: docs-embedded-or-external
description: How TemplrPress serves markdown compiled into the binary, from a mounted folder, or both — UNION and REPLACE modes explained with the exact YAML.
date: 2026-07-18T00:00:00Z
published: true
type: blog
category: Engineering
author: Senthilnathan (senthilsweb)
sort_order: 20
tags: [docs, go-embed, docker, volumes, cms, configuration]
---

# Docs, Embedded or External — One Binary, Two Content Modes

TemplrPress compiles your markdown into the binary with `go:embed`. That
makes deployment one file — but it would also mean rebuilding for every
typo fix. So the loader supports disk overrides: point it at a folder and
content changes land without touching the binary.

## Why?

*"If content is compiled in, do I have to rebuild the binary every time I
edit a page?"*

No. Embedded content is the default, and two override modes change that
per deployment, not per build.

## The two modes

| Mode | Config | Behavior |
|------|--------|----------|
| UNION | `cms.source: /path/to/content` | Disk content merges with embedded content; embedded wins when the same path exists in both |
| REPLACE | `cms.folders.docs.source: /path/to/docs` | That one folder is served only from disk; its embedded entries are ignored |

```yaml
cms:
  source: "./content"        # UNION: merge disk with embedded
  folders:
    docs:
      source: "./my-docs"    # REPLACE: docs come only from here
```

The blog folder goes one step further: it is **always external**. The
loader looks for `./content/blog`, then `./blog`, on disk. If neither
exists, `/blog` is simply empty — the embedded sample post is never
served. This post you are reading came off disk, not out of the binary.

## The same idea for OpenAPI specs

Spec files follow the pattern too. A spec registered as
`/static/openapi/myapi.json` is read from the embedded FS first, and from
disk as a fallback. In Docker that means:

```yaml
volumes:
  - ./openapi:/app/static/openapi
```

drops new specs into a running container — no rebuild.

## One honest aside

Docs pages sort by a `sort_order` frontmatter key, and the loader treats
`0` as "unset" (it is Go's zero value), pushing the page to the very end.
The new Introduction page shipped with `sort_order: 0` and landed last in
the sidebar instead of first. It now uses `1`, and Installation moved to
`2`. If your page sorts strangely, check for a zero.

## What's next

- Cache TTL tuning for disk-mode content (`cms.cache_ttl` exists; needs a
  dedicated guide).
- A worked example of running docs from a separate git repository via a
  mounted volume.

## Try it

```bash
./templrpress init -o config.yaml
# set cms.folders.docs.source to any folder of markdown
./templrpress -f config.yaml
```

— Senthil

## Related reading

- **[Introducing TemplrPress](/blog/introducing-templrpress)** — what the platform is and why it exists.
- **[An API explorer for any OpenAPI spec](/blog/api-explorer-any-openapi-spec)** — the spec viewer, including the volume-mount fallback.
