# Tasks — docs-consolidation

> References: [`proposal.md`](./proposal.md)

- [x] 1. Write `getting-started.md` (sort 2) merging installation +
       quickstart + configuration; every command appears once.
- [x] 2. Rewrite `authoring.md` as "Authoring content" (sort 10) merging
       authoring + cms; frontmatter table reconciled (title required,
       slug defaults to basename, published defaults true).
- [x] 3. Write `advanced-configuration.md` (sort 30): external content
       UNION/REPLACE with `cms:` syntax, theming, suppressing embedded
       content (`docs_root` / docs-empty), auth stub + `show_auth_buttons`
       (dummy-auth status vs templrgo), OpenAPI disk fallback, hiding
       routes.
- [x] 4. Delete installation.md, quickstart.md, configuration.md, cms.md.
- [x] 5. Update introduction.md links + Next steps; sweep old slugs across
       content/ and config.example.yaml.
- [x] 6. Rebuild, verify sidebar order and that all internal links resolve.
- [x] 7. Register change in openspec/README.md.
