# Proposal — Getting-started docs consolidation

> **Related specs**: [`openspec/project.md`](../../project.md)

## Summary

The Getting Started section has 9 pages with heavy duplication and stale
config syntax. Consolidate to 6: merge Installation + Quickstart +
Configuration into one **Getting Started** page, merge CMS + Authoring into
one **Authoring content** page, and add a new **Advanced configuration**
page for overrides, theming, suppressing embedded content, and the auth
stub ("dummy" auth à la templrgo).

## Problem statement

| Duplication | Where |
|---|---|
| `docker run` one-liner | installation, quickstart, introduction |
| `git clone && make all` | installation, quickstart |
| External content override | configuration, cms, introduction |
| Folder layout tree | cms, authoring |
| Frontmatter reference | cms, authoring (with conflicting required/optional flags) |

Also stale: configuration.md and cms.md document the deprecated `content:`
block; the current loader uses `cms:` (with `content:` folded in for
backward compatibility). Readers following the docs get the legacy syntax.

## Proposed solution

New page map (sort_order in parentheses):

| Page | Slug | Content |
|---|---|---|
| Introduction (1) | `introduction` | unchanged, links updated |
| Getting Started (2) | `getting-started` | install (binary / Docker / source), verify, author-your-own-site loop, `init`, config file tour, env vars + flag precedence, logging |
| Authoring content (10) | `authoring` | folder layout, full frontmatter reference, markdown features, publish rules — merged from authoring.md + cms.md |
| Branding (20) | `branding` | unchanged |
| Advanced configuration (30) | `advanced-configuration` | external content UNION/REPLACE (`cms:` syntax), theming, suppressing embedded/sample content, auth stub & `show_auth_buttons` ("dummy" auth status vs templrgo), OpenAPI disk fallback, hiding routes |
| OpenAPI specs (35) / Deployment (40) | unchanged | |

Deleted: installation.md, quickstart.md, configuration.md, cms.md.

Link sweep: `/docs/installation`, `/docs/quickstart`, `/docs/configuration`
→ `/docs/getting-started`; `/docs/cms` → `/docs/authoring` — across
content/, config.example.yaml, and the SPA (if referenced).

## Non-goals

- No slug redirects on the server (the docs SPA 404s gracefully; old deep
  links are only days old).
- No implementation of templrgo-style dummy auth — the page documents the
  stub as it is. (Flagged separately: implementing it would contradict the
  project north star's "no login" rule; needs an explicit decision.)

## Acceptance criteria

- [ ] Sidebar shows exactly: Introduction, Getting Started, Authoring
  content, Branding, Advanced configuration, OpenAPI specs, Deployment
  (plus the NPI-free existing extras, if any).
- [ ] No page documents the deprecated `content:` block except as a
  one-line backward-compat note.
- [ ] `grep -rn "/docs/installation\|/docs/quickstart\|/docs/configuration\|/docs/cms"`
  over content/ and config.example.yaml returns nothing.
- [ ] Every command shown appears exactly once across the section.
