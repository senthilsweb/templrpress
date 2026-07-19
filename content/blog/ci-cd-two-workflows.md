---
title: "CI/CD in TemplrPress — One Workflow Ships the Binary, One Maps the Code"
slug: ci-cd-two-workflows
description: Two GitHub Actions — a multi-arch Docker publish to ghcr.io, and a graphify pipeline that commits a 294-node knowledge graph of the repo on every push.
date: 2026-07-19T00:00:00Z
published: true
type: blog
category: Engineering
author: Senthilnathan (senthilsweb)
sort_order: 50
tags: [ci-cd, github-actions, docker, knowledge-graph, graphify, ghcr, llm]
---

# CI/CD in TemplrPress — One Workflow Ships the Binary, One Maps the Code

TemplrPress now runs two GitHub Actions workflows. `docker.yml` builds the
Next.js export, embeds it in the Go binary, and publishes a multi-arch
image to `ghcr.io`. `graphify.yml` rebuilds a **knowledge graph** of the
whole repository — 294 nodes, 634 links today — and commits it to the repo
root on every code push.

## Why a knowledge graph in CI?

*Why would a CMS repo regenerate a graph of its own code on every push?*

Two consumers, neither of them human. LLM coding agents read the 4.8 KB
`graph-index.json` first — entry files, top symbols, and cross-module
calls for 11 modules — instead of grep-scanning the repo, which saves
context tokens on every session. And TemplrGo's knowledge-graph explorer
loads the full `graph.json` straight from the raw GitHub URL, so the
visual map of TemplrPress is always at most one push behind the code.
The root `CLAUDE.md` tells agents both files exist and which to read first.

The idea comes from Andrej Karpathy's LLM-wiki workflow, by way of the
open-source [graphify](https://pypi.org/project/graphifyy/) tool. CI runs
only graphify's deterministic AST extraction — imports, calls, defines —
so there is no LLM call and no API cost in the pipeline.

## The publish workflow

`docker.yml` is the gatekeeper. Every push and pull request builds the SPA
export, runs `go vet`, and compiles the binary. On `main` and `v*` tags it
goes further: Buildx + QEMU produce `linux/amd64` and `linux/arm64` images,
tagged with branch, semver, short SHA, and `latest`, pushed to `ghcr.io`.

*[Screenshot: ghcr.io package page — templrpress image tags]*

The graph commit carries `[skip ci]` precisely so this workflow does not
rebuild a Docker image because two JSON files changed.

## The bug we caught before the first commit

The build script was copied from TemplrGo, and TemplrGo's version emits
cytoscape-style JSON — every node wrapped in a `{"data": {...}}` envelope.
But TemplrGo's own Go loader parses NetworkX node-link
(`{directed, nodes[], links[]}`), and so does the upstream graphify tool
(`json_graph.node_link_data` in its `export.py`). Pointed at the cytoscape
file, the explorer would load zero nodes. TemplrPress emits node-link from
day one; TemplrGo's CI script still has the mismatch to fix.

## What's next

- No semantic pass in CI — every node sits in `community: 0` until the
  LLM-driven clustering step runs locally.
- No test suite in the gate yet — `go vet` and a version smoke-check are
  the only checks.
- No release workflow — `v*` tags publish an image, but changelogs and
  GitHub Releases are still manual.

## Try it

```bash
docker pull ghcr.io/senthilsweb/templrpress:latest
curl -s https://raw.githubusercontent.com/senthilsweb/templrpress/main/graph-index.json | head -40
```

Full reference: [CI/CD docs](/docs/ci-cd).

— Senthilnathan

## Related reading

- **[CI/CD](/docs/ci-cd)** — triggers, skip markers, and failure behaviour for both workflows.
- **[Introducing TemplrPress](/blog/introducing-templrpress)** — the single binary the pipeline ships.
- **[Deployment](/docs/deployment)** — running the published image.
