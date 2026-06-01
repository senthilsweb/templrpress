# Design — openapi-disk-fallback

> References: [`proposal.md`](./proposal.md)

## Affected file

`internal/server/api.go` — `handleOpenAPISpec` function.

## Before (embed-only)

```go
rel := strings.TrimPrefix(e.URL, "/")
rel = strings.TrimPrefix(rel, "static/")
data, err := fs.ReadFile(staticSub, rel)
if err != nil {
    writeJSON(w, http.StatusNotFound, map[string]string{"error": "spec file not found"})
    return
}
```

## After (embed + disk fallback)

```go
rel := strings.TrimPrefix(e.URL, "/")
rel = strings.TrimPrefix(rel, "static/")
data, err := fs.ReadFile(staticSub, rel)
if err != nil {
    // Fallback: try reading from disk (supports volume-mounted spec files).
    data, err = os.ReadFile(filepath.Join("static", rel))
}
if err != nil {
    writeJSON(w, http.StatusNotFound, map[string]string{"error": "spec file not found", "reason": err.Error()})
    return
}
```

New imports: `"os"`, `"path/filepath"`.

## Path resolution

| Location     | Resolves to                              |
|--------------|------------------------------------------|
| embed.FS     | compiled `static/` tree                  |
| disk fallback| `<cwd>/static/<rel>` → `/app/static/<rel>` in Docker |

## Docker volume-mount pattern

```yaml
volumes:
  - ./openapi:/app/static/openapi   # spec JSON files land in the fallback path
```

Config entry:
```yaml
openapi_specs:
  - name: my-api
    url: /static/openapi/my-api.json
```

The `/static/` prefix in `url` is stripped by `handleOpenAPISpec` before the
path is resolved, so `/static/openapi/my-api.json` becomes `openapi/my-api.json`
which resolves on disk to `/app/static/openapi/my-api.json`.

## Security notes

- `rel` is derived from a config value (not user input), so path-traversal
  risk is low. The URL is validated at config-load time to start with `/static/`.
- No directory listing is exposed; the disk read is for a single, exact path.
