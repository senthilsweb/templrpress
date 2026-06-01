# OpenSpec — TemplrPress

OpenSpec is the lightweight change-proposal workflow used by this project.
Each non-trivial change lives in a folder under `openspec/changes/<change-id>/`
with three files:

- `proposal.md` — **why** and **what**, scope, acceptance criteria.
- `tasks.md` — numbered checklist of implementation steps.
- `design.md` — data model, routes, template impact, dependency notes.

## Active changes

| Change ID | Summary | Status |
|-----------|---------|--------|
| [`openapi-disk-fallback`](changes/openapi-disk-fallback/proposal.md) | Disk fallback in `handleOpenAPISpec` so volume-mounted spec files work without rebuilding the binary | implemented |

## Project north star

TemplrPress stays **small** on purpose:

| Allowed                                  | Not allowed                            |
|------------------------------------------|----------------------------------------|
| Markdown-driven pages                    | Databases (BoltDB, SQLite, Postgres)   |
| YAML configuration                       | Login / signup / OAuth / RBAC          |
| Tailwind + Swagger UI via CDN            | Next.js, React, or other JS frameworks |
| Go stdlib + `goldmark` + `yaml.v3`       | Background workers, queues, schedulers |

When in doubt, **say no** and ship a smaller change.
