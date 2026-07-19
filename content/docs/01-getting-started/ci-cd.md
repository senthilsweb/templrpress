---
title: "CI/CD"
slug: ci-cd
description: "The two GitHub Actions workflows behind TemplrPress — Docker build-and-publish and the Graphify knowledge-graph pipeline — and how to trigger, skip, and debug them."
category: Getting Started
sort_order: 50
published: true
---

# CI/CD

TemplrPress ships with two GitHub Actions workflows in `.github/workflows/`.
One builds and publishes the product; the other builds and publishes a map
of the product's own code.

| Workflow | File | What it produces |
|---|---|---|
| `build-and-publish` | `docker.yml` | Multi-arch Docker image on `ghcr.io` |
| `Graphify Knowledge Graph` | `graphify.yml` | `graph.json` + `graph-index.json` at the repo root |

## build-and-publish (`docker.yml`)

Runs on every push to `main`, on `v*` tags, on pull requests, and on manual
dispatch. It has two jobs.

**Job 1 — Go build & test.** Builds the Next.js static export
(`npm ci && npm run build` in `templrpress-nextjs/`), then compiles the Go
binary with the export embedded:

```bash
go vet ./...
go build -trimpath -ldflags "-s -w" -o templrpress .
./templrpress version
```

This job is the gate: pull requests run only this far.

**Job 2 — Build & push Docker image.** Skipped on pull requests. Uses
Buildx + QEMU to build `linux/amd64` and `linux/arm64` images and pushes
them to `ghcr.io` with tags for the branch, the semver (on `v*` tags),
the short commit SHA, and `latest` on `main`. Build layers are cached in
GitHub Actions cache, so unchanged stages are not rebuilt.

One detail in the `Dockerfile` matters here: the Next.js export is built
in its own stage on the runner's **native platform**. Building it under
QEMU arm64 emulation crashed with SIGILL, so the SPA stage runs natively
and only the final Go cross-compile targets both architectures.

*[Screenshot: Actions run — go-build and docker jobs green]*

Pull the published image:

```bash
docker pull ghcr.io/senthilsweb/templrpress:latest
```

## Graphify Knowledge Graph (`graphify.yml`)

Rebuilds a structural **knowledge graph** of the repository — every file,
symbol, import, and call, extracted by AST parsing with the open-source
[graphify](https://pypi.org/project/graphifyy/) tool (pinned at `0.4.23`).
No LLM is involved; the run costs nothing beyond CI minutes.

Triggers:

- push to `main` that touches code paths (`*.go`, `templrpress-nextjs/src/`,
  `cmd/`, `internal/`, `content/`, `scripts/`)
- weekly full rebuild, Mondays 06:00 UTC
- manual `workflow_dispatch`

The run executes two scripts and commits two files to the repo root:

| File | Format | Purpose |
|---|---|---|
| `graph.json` | NetworkX node-link (`{directed, nodes[], links[]}`) | Full graph — currently 294 nodes, 634 links. Consumed remotely by TemplrGo's knowledge-graph explorer. |
| `graph-index.json` | Custom, ≤50 KB (currently 4.8 KB, 11 modules) | Per-module summary — entry files, top symbols, cross-module calls. Read by LLM coding agents first, per `CLAUDE.md`, instead of grep-scanning the repo. |

Node-link is the format the upstream graphify tool itself emits
(`json_graph.node_link_data`), so anything that reads graphify output —
TemplrGo's Go loader, `react-force-graph`, NetworkX — reads these files
directly.

*[Screenshot: TemplrGo knowledge-graph explorer loading templrpress graph.json]*

**Loop protection.** The bot commit message carries two markers:
`[skip graphify]` stops the workflow from re-triggering itself, and
`[skip ci]` stops the Docker workflow from rebuilding the image over a
JSON-only change. If the graph is unchanged, no commit is made at all.

**Failure behaviour.** A failed run never blocks `main`. It uploads the
partial output as a 7-day artifact and opens (or updates) a single issue
labelled `graphify-failure`.

## Common operations

Trigger a manual rebuild of either workflow:

```bash
gh workflow run graphify.yml
gh workflow run docker.yml
```

Skip the graph rebuild for one commit:

```bash
git commit -m "docs: fix typo [skip graphify]"
```

Regenerate the graph locally (do not commit the result — CI owns both
files):

```bash
pip install graphifyy==0.4.23
python scripts/graphify-build.py .
python scripts/graphify-index.py graphify-out/graph.json graph-index.json
```

## Related reading

- **[Deployment](/docs/deployment)** — running the published binary or Docker image.
- **[Advanced configuration](/docs/advanced-configuration)** — deployment-time knobs the image respects.
- **[Introducing TemplrPress](/blog/introducing-templrpress)** — what the single binary actually contains.
