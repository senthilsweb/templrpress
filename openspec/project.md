# TemplrPress — project context

A single-binary Go server that publishes a markdown site (landing page, docs,
optional blog, API reference, about page).

## Origin

Distilled from [TemplrGo](https://github.com/senthilsweb/templrgo) by
extracting **only** the public CMS surface:

| Carried over from TemplrGo | Removed |
|----------------------------|---------|
| Landing page hero          | Auth, sessions, RBAC |
| Markdown docs + blog       | Embedded Next.js SPA |
| Footer CTA + credit band   | BoltDB and KV store |
| Top navigation             | SQL editors, MongoDB playground, schedulers |
| YAML config                | Lua engine, chat sidecar, gateway |
| Single-binary `embed.FS`   | Diagrams, code snippets, knowledge graph |

## Tech stack

- Go 1.22 standard library (`net/http`, `html/template`, `embed`)
- [`github.com/yuin/goldmark`](https://github.com/yuin/goldmark) for markdown
- [`gopkg.in/yaml.v3`](https://gopkg.in/yaml.v3) for config + frontmatter
- Tailwind CSS via CDN (no build step)
- Swagger UI via CDN for `/api-docs`

## Routes

| Path           | Notes |
|----------------|-------|
| `GET /`        | Landing (always on) |
| `GET /about`   | Renders `content/about.md` |
| `GET /docs`    | Redirects to first published doc |
| `GET /docs/{slug}` | Renders one doc with sidebar grouped by `NN-section/` folder |
| `GET /blog`    | Only when `blog.enabled = true` |
| `GET /blog/{slug}` | Single post |
| `GET /api-docs`    | Swagger UI loads `api_docs.spec_url` |
| `GET /static/...`  | Embedded `static/` filesystem |
| `GET /healthz`     | Liveness JSON |

## Config schema

See [`../config.example.yaml`](../config.example.yaml) for the full schema with
inline comments. Required defaults are applied in
`internal/config/applyDefaults`.
