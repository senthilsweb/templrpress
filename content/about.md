---
title: About TemplrPress
description: A lightweight, single-binary markdown publishing platform.
---

# About TemplrPress

**TemplrPress** is a tiny, opinionated, single-binary content site built in Go.
It serves a landing page, markdown documentation, an optional blog, and an API
reference — all driven by one YAML config file.

## Why?

Most static-site generators need a build step, a Node toolchain, or a separate
hosting layer. TemplrPress takes a different approach:

- **One binary.** Everything ships compiled in: templates, default content,
  Tailwind via CDN, Swagger UI for API docs.
- **Config-driven.** Branding, navigation, hero text, blog visibility, and API
  spec source are all set in `config.yaml`.
- **Markdown-first.** Drop `.md` files into `content/docs/` or `content/blog/`
  and they appear automatically. YAML frontmatter controls title, slug,
  ordering, and visibility.

## Stack

- Go 1.22 standard library `net/http`
- [goldmark](https://github.com/yuin/goldmark) for markdown rendering
- `gopkg.in/yaml.v3` for config + frontmatter
- Tailwind CSS via CDN (no build step)
- Swagger UI via CDN for API docs

That's it.
