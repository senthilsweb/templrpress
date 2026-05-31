# Copilot / AI Agent Instructions — TemplrPress

> Read [`AGENTS.md`](../AGENTS.md) first for routing, then this file for the
> Definition of Done. These rules override prior assumptions.

## Project shape

TemplrPress is a **deliberately minimal** Go server:

- One binary. No Node, no build step, no database.
- Tailwind + Swagger UI come from CDNs.
- Markdown is the only content format.
- Public-only: no auth, no sessions, no RBAC.

Resist the urge to add features beyond what's requested. The whole value of
this project is its smallness.

## Definition of Done — every change

### 1. Code conventions

- Go 1.22+; stdlib first. Allowed third-party deps: `goldmark`, `gopkg.in/yaml.v3`.
- Adding a new direct dependency requires a note in `openspec/changes/<id>/design.md`.
- Handlers live in `internal/server/server.go`; markdown logic in `internal/cms/`.
- Templates use `html/template` with `{{define "content"}}` blocks.
- No client-side JS frameworks. Vanilla `<script>` only.

### 2. Configuration

Every new YAML key MUST:
1. Appear in `config.example.yaml` with an inline comment.
2. Have a default applied in `internal/config/applyDefaults`.
3. Be type-safe via a struct field in `internal/config/config.go`.

### 3. Templates / UI

- Use `var(--tg-primary)` for accent colour, never a hardcoded hex.
- Every Tailwind colour class has a `dark:` pair.
- New pages register in `templates/<name>.html` with `{{define "content"}}` and
  a route in `internal/server/server.go::routes`.

### 4. Content

- Markdown under `content/` is embedded by default; users override via
  `content.source`.
- Frontmatter fields recognised: `title`, `slug`, `description`, `date`,
  `published`, `author`, `category`, `tags`, `cover_image`, `sort_order`.

### 5. Docker / CI

- `Dockerfile` MUST stay multi-stage and produce a non-root container on alpine.
- `.github/workflows/docker.yml` MUST stay multi-arch (`linux/amd64`, `linux/arm64`).
- Public image published to `ghcr.io/<owner>/templrpress`.

### 6. Documentation

- Any user-visible feature gets a markdown page under
  `content/docs/02-guides/`.
- Update `README.md` only when the top-level surface changes.

## Top drift mistakes — DON'T

- ❌ Add Next.js, React, or any JS framework.
- ❌ Introduce a database (BoltDB, SQLite, anything).
- ❌ Add login, signup, sessions, OAuth, RBAC.
- ❌ Add data-tooling pages (SQL editors, query playgrounds, schedulers).
- ❌ Ship secrets in `config.example.yaml`.
- ❌ Hardcode brand colours in templates.
- ❌ Add a new top-level directory without justification.

## Issue tracking

Optional, but if used: open a GitHub issue **before** non-trivial work, with a
`type:*` label (`bug`, `feature`, `enhancement`, `change`, `task`, `docs`)
and a one-line summary. Close with a resolution comment after merging.
