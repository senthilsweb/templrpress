# Proposal — OpenAPI spec disk fallback for volume-mounted files

> **Related specs**:
> - [`openspec/project.md`](../../project.md) — architectural constraints

## Summary

When `openapi_specs[].url` references a `/static/…` path, the handler
currently resolves it exclusively from the Go `embed.FS` compiled into the
binary. Files volume-mounted at `/app/static/openapi/` at runtime are
invisible to `embed.FS` and therefore always return 404.

This change adds a one-step disk fallback so Docker deployments can supply
custom spec files without rebuilding the binary.

## Problem statement

TemplrPress bundles its `static/` tree into the binary via `go:embed`. The
`handleOpenAPISpec` handler calls `fs.ReadFile(embed.FS, rel)` with no disk
path. Any spec file added to a volume mount is silently unreachable at the
`/api/openapi-spec?spec=<name>` endpoint, making the feature unusable for
containerised custom-spec deployments.

## Proposed solution

After `fs.ReadFile` fails (path not in the embedded FS), attempt
`os.ReadFile(filepath.Join("static", rel))`. Since the container working
directory is `/app`, this resolves to `/app/static/openapi/<file>`, which is
exactly the path a volume mount of `./openapi:/app/static/openapi` would
populate.

No fallback chain or config flag is needed: embedded wins (faster, no disk IO),
disk is the graceful fallback for runtime injection.

## Scope

- `internal/server/api.go` — `handleOpenAPISpec`: add `os`/`filepath` imports
  and a two-line disk fallback after the embed read.
- `content/docs/01-getting-started/openapi-specs.md` — new section documenting
  the Docker volume-mount pattern.
- `content/docs/01-getting-started/deployment.md` — volume mount example
  updated to include `./openapi:/app/static/openapi`.
- `config.example.yaml` — `openapi_specs` block comment updated.

## Acceptance criteria

- [ ] `GET /api/openapi-spec?spec=<name>` returns `200` when the spec JSON is
  placed under a volume-mounted `./openapi/` directory.
- [ ] Embedded spec files continue to work unchanged.
- [ ] The docs `/rest-api-spec` viewer loads volume-mounted specs.
- [ ] CI green on `main`.
