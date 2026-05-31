# templrpress

A single-binary, config-driven markdown publishing platform.

`templrpress` ships a pre-built Next.js 16 SPA (static-exported) embedded inside a Go HTTP server via `go:embed`. Markdown content under `content/` is rendered server-side and exposed through a small JSON API; the SPA consumes that API for every page.

## Stack

- Go 1.21 server + `goldmark` markdown
- Next.js 16 / React 19 SPA (TypeScript, Tailwind 4, shadcn/ui, lucide-react, @tanstack/react-query)
- Single 12 MB binary — no Node, no DB, no external assets at runtime

## Quick start

```bash
# Local dev (requires Node 20+ for SPA build, Go 1.21+)
make all                          # tidy + build SPA + build Go binary
./bin/templrpress -p 9898         # http://localhost:9898

# Docker
make docker
docker run --rm -p 5000:5000 templrpress:latest
```

## Layout

```
.
├── main.go                   # embed roots + cmd dispatcher
├── cmd/                      # CLI entry (serve, init, version)
├── internal/
│   ├── config/               # YAML config loader
│   ├── cms/                  # markdown loader + frontmatter parser
│   └── server/               # HTTP routes + JSON API
├── content/                  # markdown sources (docs/, about.md, blog/)
├── static/                   # embedded /static/* (favicon, openapi.yaml)
├── templrpress-nextjs/       # Next.js SPA — built into out/, embedded
└── config.example.yaml       # default config (env: TEMPLRPRESS_CONFIG)
```

## Configuration

Generate a starter config and edit it:

```bash
./bin/templrpress init -o config.yaml
./bin/templrpress -f config.yaml
```

Override port / host:

```bash
./bin/templrpress -p 8080 -H 127.0.0.1
TEMPLRPRESS_PORT=8080 ./bin/templrpress
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` / `/readyz` | Liveness / readiness |
| GET | `/api/version` | Build metadata |
| GET | `/api/config/branding` | Branding payload (consumed by SPA) |
| GET | `/api/config/servers` | Empty stub for templrgo-shaped clients |
| GET | `/api/config/openapi-specs` | List of available OpenAPI specs |
| GET | `/api/openapi-spec` | The active OpenAPI document |
| GET | `/api/cms/docs/nav` | Docs sidebar tree |
| GET | `/api/cms/list?type=<folder>` | List articles in a folder |
| GET | `/api/cms/{folder}/{slug}` | Single article (markdown + html) |
| GET | `/api/cms/about/{slug}` | About profile |
| GET | `/api/auth/status` / `/api/auth/logout` | Auth stubs |

## Build pipeline

1. `npm run build` in `templrpress-nextjs/` produces a static export in `out/`.
2. `go build .` embeds `templrpress-nextjs/out/` (and `static/`, `content/`) into the binary.

`make all` performs both steps; the multi-stage `Dockerfile` does the same in CI.

## License

Apache-2.0
