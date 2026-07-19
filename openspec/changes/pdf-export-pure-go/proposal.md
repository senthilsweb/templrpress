# Defect + Proposal — PDF export returns 404 (pure-Go fix)

> **Related specs**: [`openspec/project.md`](../../project.md)

## Defect

The article header on docs and blog pages renders a top-right download
button whenever a `pdfUrl` prop is passed — and both pages always pass it:

- docs: `/api/cms/pdf/{folder}/{slug}` (`app/docs/page.tsx:618`)
- blog: `/api/cms/pdf/{slug}` (`app/blog/page.tsx:531`)

The Go server has **no** `/api/cms/pdf/` route. The request falls through
to `handleCMSArticle`, which treats `pdf` as a folder name and returns
`{"error":"not found"}` with 404. The button has never worked in
TemplrPress; the URLs were carried over from templrgo, where a PDF
service exists.

Repro: click the download icon on any docs or blog article → 404 JSON.

## Proposed fix

Server-side markdown → PDF rendering, pure Go, no external processes:

- New route `/api/cms/pdf/` handled by `handleCMSPDF`: resolves
  `{folder}/{slug}` or bare `{slug}` with the same loader lookup rules as
  `handleCMSArticle`.
- Rendering via **`github.com/stephenafamo/goldmark-pdf`** — a goldmark
  renderer that emits PDF directly (built on fpdf, pure Go). The same
  markdown pipeline that feeds HTML feeds the PDF, so output stays
  consistent with the site.
- Response headers: `Content-Type: application/pdf`,
  `Content-Disposition: attachment; filename="{slug}.pdf"`.
- Styling: article title + author/date subtitle from frontmatter, brand
  link color, readable serif/sans pairing from the library's built-in
  font sets. Elegant defaults over configurability.

## Constraints check

| Constraint | Status |
|---|---|
| Single binary | ✅ pure-Go dependency, fonts embedded |
| No external processes | ✅ no wkhtmltopdf / Chrome |
| Config-driven | n/a (no new config) |

## Acceptance criteria

- [ ] `GET /api/cms/pdf/docs/introduction` returns 200, `%PDF-` magic
  bytes, and a well-formed multi-page document.
- [ ] `GET /api/cms/pdf/introducing-templrpress` (bare slug, blog) works.
- [ ] Unknown slug returns 404 JSON as before.
- [ ] Download button on docs and blog pages saves a readable PDF with
  headings, code blocks, lists, and links intact.
- [ ] Binary size increase noted in the change log (< a few MB).
