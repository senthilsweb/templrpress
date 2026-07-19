# Tasks — pdf-export-pure-go

> References: [`proposal.md`](./proposal.md)

- [x] 1. `go get github.com/stephenafamo/goldmark-pdf`; review its API and
       font options.
- [x] 2. `internal/server/pdf.go` — `handleCMSPDF`: path parsing
       ({folder}/{slug} and bare {slug}), loader lookup, 404 JSON on miss.
- [x] 3. Render markdown body to PDF with title/author/date header block;
       brand-appropriate link color; sensible fonts.
- [x] 4. Register `/api/cms/pdf/` in server.go BEFORE the `/api/cms/`
       catch-all.
- [x] 5. Verify: curl both URL forms, check `%PDF-` magic + non-trivial
       size; open one PDF and eyeball headings/code/lists.
- [x] 6. Note binary size delta.
- [x] 7. Register change in openspec/README.md.

> Binary size: 16 MB → 22 MB (+6 MB: embedded Go font family + chroma).
