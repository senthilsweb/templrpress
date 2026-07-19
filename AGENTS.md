# AGENTS.md — TemplrPress

> Routing guide for AI coding agents (Copilot, Claude, Cursor, Aider) and
> human newcomers. Read this **first** before generating code or specs.

## 60-second onboarding

1. **This file** — routing.
2. [`README.md`](README.md) — what the project does and how to run it.
3. [`config.example.yaml`](config.example.yaml) — canonical config schema.
4. [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — Definition of Done.
5. [`openspec/README.md`](openspec/README.md) — active change proposals.

## What this project is

**TemplrPress** — a tiny single-binary Go server that publishes a markdown
site (landing, docs, blog, API reference, about). Distilled from TemplrGo
to keep only the public CMS surface; **no auth, no RBAC, no databases, no
embedded data tools, no Next.js.**

- Go 1.22 stdlib `net/http`
- `html/template` for views; Tailwind via CDN
- [`goldmark`](https://github.com/yuin/goldmark) for markdown
- `gopkg.in/yaml.v3` for config + frontmatter
- Swagger UI via CDN for `/api-docs`

## Definition of Done — every change

A change is not complete until ALL of these are true:

### Code
- [ ] No new runtime dependency unless it replaces something larger.
- [ ] Single-binary build still works (`go build -o templrpress .`).
- [ ] No external network calls at boot.
- [ ] No hex literals in templates — use `var(--tg-primary)`.
- [ ] All Tailwind colour utilities have `dark:` pairs.

### Configuration
- [ ] Any new YAML key is documented in `config.example.yaml` with a comment.
- [ ] Sensible default applied in `internal/config/applyDefaults`.
- [ ] Toggle (`enabled: bool`) for any new optional surface.

### Templates
- [ ] Page templates define `{{define "content"}}` (and optionally
  `page_title`, `extra_head`).
- [ ] No client-side JS frameworks introduced. Vanilla JS only.

### Docs
- [ ] Update `README.md` if the user-visible surface changes.
- [ ] Add or update a markdown file under `content/docs/02-guides/` for
  user-facing features.

### Machine-readable surfaces (before build or commit)
- [ ] Docs, blog, or site config changed → regenerate the repo-root
  `llms.txt` with `go run . llms -o llms.txt` (or `make llms`). It uses
  the same code path as the live `/llms.txt` endpoint — never hand-edit
  it, and never let a content change ship without it.
- [ ] Any `/api/*` route or response shape changed → update
  `static/openapi.yaml`, the built-in spec served at `/api/openapi-spec`
  and rendered by the `/rest-api-spec` explorer. Every public route must
  be listed, `/llms.txt` included.

### Infra
- [ ] `Dockerfile` still produces a working multi-arch image.
- [ ] `.github/workflows/docker.yml` still passes.

## Top drift mistakes (quick checklist)

- ❌ Adding a database, queue, or background worker → ✅ stay file-driven.
- ❌ Introducing Node/npm or a JS build step → ✅ Tailwind + Swagger via CDN.
- ❌ Hardcoded brand colour in templates → ✅ `var(--tg-primary)`.
- ❌ Adding auth, sessions, or RBAC → ✅ this project is intentionally public-only.
- ❌ Coupling routes to filesystem layout in handlers → ✅ go through `internal/cms`.
- ❌ New config key with no default → ✅ register in `applyDefaults`.

## Useful commands

```bash
make build       # produce ./templrpress
make dev         # go run . serve -f config.example.yaml
make docker      # build local image
make llms        # regenerate repo-root llms.txt from config + content
go vet ./...     # CI runs this
```

## OpenSpec proposal flow

For non-trivial changes, create:

```
openspec/changes/<change-id>/
├── proposal.md   # what + why + scope
├── tasks.md      # numbered checklist
└── design.md     # data model, routes, template impact
```
