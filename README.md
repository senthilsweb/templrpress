# TemplrPress

A product website, docs, blog, and OpenAPI explorer in one ~15 MB Go
binary. Markdown in, website out — no Node on the server, no database,
no build step. Deploying it means copying one file.

## What you get

| Surface | Source |
|---------|--------|
| Landing page (hero, quickstart strips, feature cards) | `branding:` block in YAML |
| Docs with sidebar, table of contents, scroll-tracking | `content/docs/*.md` |
| Blog | `content/blog/*.md` |
| API explorer with cURL / JavaScript / Python samples and Try It | `openapi_specs:` entries |
| PDF export for any article (pure Go) | built in |
| JSON API for all of the above, plus `/llms.txt` for AI readers | built in |

## Run it

```bash
# Docker
docker run --rm -p 5000:5000 ghcr.io/senthilsweb/templrpress:latest

# Or the bare binary (no Docker needed)
curl -LO https://github.com/senthilsweb/templrpress/releases/latest/download/templrpress-darwin-arm64
chmod +x templrpress-darwin-arm64 && ./templrpress-darwin-arm64
```

Open <http://localhost:5000> — the site you see is the documentation for
the binary that is serving it.

## Configure it

One YAML file drives everything — branding, navigation (flyout menus),
hero layout, feature cards, footer, OpenAPI specs:

```bash
./templrpress init -o config.yaml
./templrpress -f config.yaml
```

Content is embedded at build time, but disk overrides let you change
markdown without rebuilding — and the blog is always read from disk.
The full guides live in the app itself under **Docs → Getting Started**
and **Advanced configuration**.

## Build from source

Requires Go 1.21+ and Node 20+ (build time only):

```bash
git clone https://github.com/senthilsweb/templrpress
cd templrpress
make all                      # SPA static export + Go binary → bin/templrpress
./bin/templrpress -p 9898
```

## For AI readers

`/llms.txt` serves the site map in markdown. The repo root also carries a
continuously regenerated code map (`graph.json` + `graph-index.json`) so
coding agents can navigate the codebase without scanning it.

## License

Apache-2.0
