# Tasks — openapi-disk-fallback

> References: [`proposal.md`](./proposal.md)

- [x] 1. Add `"os"` and `"path/filepath"` imports to `internal/server/api.go`.
- [x] 2. In `handleOpenAPISpec`, after `fs.ReadFile(staticSub, rel)` fails,
       call `os.ReadFile(filepath.Join("static", rel))` as the disk fallback.
- [x] 3. Return `404` only when both the embed and disk reads fail.
- [ ] 4. Update `content/docs/01-getting-started/openapi-specs.md` —
       add "Volume-mounted spec files (Docker)" section.
- [ ] 5. Update `content/docs/01-getting-started/deployment.md` —
       add `openapi` volume to the Docker and docker-compose examples.
- [ ] 6. Update `config.example.yaml` `openapi_specs` block comment.
- [ ] 7. Update `openspec/README.md` to list this change as active → then
       move to archived once merged.
- [x] 8. Fix CI: commit missing `config.go` / `server.go` / SPA changes that
       were left unstaged from the preceding `feat(docs)` commit.
