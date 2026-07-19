# CLAUDE.md — TemplrPress

Read [`AGENTS.md`](AGENTS.md) for repo routing, conventions, and the
Definition of Done. This file adds LLM-specific guidance only.

## Knowledge graph — use it before scanning the repo

The repo root carries two auto-generated knowledge-graph files (rebuilt by
`.github/workflows/graphify.yml` on pushes to `main` and weekly):

- **`graph-index.json`** (≤50 KB) — token-cheap per-module summary: entry
  files, top symbols, and cross-module `calls` / `called_by` edges. **Read
  this first** when you need to orient in the codebase, locate a feature, or
  trace which modules depend on each other — it replaces broad `grep`/file
  sweeps and saves significant context tokens.
- **`graph.json`** — the full structural graph (NetworkX node-link format:
  `{directed, nodes[], links[]}`, AST-extracted imports/calls/defines with
  repo-relative `source_file` on every node). Consult it only when the index
  is not granular enough, e.g. to find every caller of a specific symbol.
  It is also consumed remotely by TemplrGo's knowledge-graph explorer UI.

The repo root also carries `llms.txt` — a markdown site map of every
published docs and blog page. Regenerate it with `make llms` (never
hand-edit) whenever docs, blog, or site config change; the same content
is served live at `/llms.txt`.

Rules:

- Never hand-edit `graph.json` or `graph-index.json`; CI overwrites them.
- If they are missing or stale, they can be regenerated locally with
  `pip install graphifyy && python scripts/graphify-build.py . && python scripts/graphify-index.py graph.json graph-index.json` —
  but do not commit regenerated files unless asked; CI owns them.
- A commit message containing `[skip graphify]` skips the CI rebuild.
