---
title: Welcome to TemplrPress
slug: welcome
description: Get started with the lightweight, single-binary markdown site.
category: Overview
sort_order: 1
published: true
---

# Welcome

TemplrPress turns a folder of markdown files into a polished website — landing
page, docs, optional blog, and API reference — served by **one Go binary** with
**zero runtime dependencies**.

## Quick start

```bash
# 1. Initialise a config file
./templrpress init

# 2. Edit config.yaml (logo, nav, hero text, blog visibility)

# 3. Drop markdown into content/docs/, content/blog/, content/about.md

# 4. Run
./templrpress serve -f config.yaml
```

Open <http://localhost:5000>.

## What's next

- See [Configuration](/docs/configuration) for every YAML option.
- See [Authoring content](/docs/authoring) for frontmatter conventions.
- See [Deployment](/docs/deployment) for Docker + GitHub Actions.
