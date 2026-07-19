package server

import (
	"bytes"
	"context"
	"fmt"
	"image/color"
	"net/http"
	"strings"

	pdfrender "github.com/stephenafamo/goldmark-pdf"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/util"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/gobolditalic"
	"golang.org/x/image/font/gofont/goitalic"
	"golang.org/x/image/font/gofont/gomono"
	"golang.org/x/image/font/gofont/gomonobold"
	"golang.org/x/image/font/gofont/gomonoitalic"
	"golang.org/x/image/font/gofont/goregular"

	"templrpress/internal/cms"
)

// The Go font family (golang.org/x/image/font/gofont) is embedded in the
// binary and registered as UTF-8 fonts, so PDF rendering needs no network
// and handles em-dashes, curly quotes, arrows, etc. The inbuilt fpdf core
// fonts are cp1252-only and mojibake anything outside Latin-1.
var (
	pdfBodyFont    = pdfrender.Font{CanUseForText: true, Family: "GoSans", Type: pdfrender.FontTypeCustom}
	pdfHeadingFont = pdfrender.Font{CanUseForText: true, Family: "GoSansBold", Type: pdfrender.FontTypeCustom}
	pdfCodeFont    = pdfrender.Font{CanUseForCode: true, Family: "GoMono", Type: pdfrender.FontTypeCustom}
)

func registerPDFFonts(p *pdfrender.Fpdf) error {
	type reg struct {
		family, style string
		ttf           []byte
	}
	all := []reg{
		{"GoSans", pdfrender.FontStyleRegular, goregular.TTF},
		{"GoSans", pdfrender.FontStyleBold, gobold.TTF},
		{"GoSans", pdfrender.FontStyleItalic, goitalic.TTF},
		{"GoSans", pdfrender.FontStyleBoldItalic, gobolditalic.TTF},
		// Headings use the bold face as their regular weight.
		{"GoSansBold", pdfrender.FontStyleRegular, gobold.TTF},
		{"GoSansBold", pdfrender.FontStyleBold, gobold.TTF},
		{"GoSansBold", pdfrender.FontStyleItalic, gobolditalic.TTF},
		{"GoSansBold", pdfrender.FontStyleBoldItalic, gobolditalic.TTF},
		{"GoMono", pdfrender.FontStyleRegular, gomono.TTF},
		{"GoMono", pdfrender.FontStyleBold, gomonobold.TTF},
		{"GoMono", pdfrender.FontStyleItalic, gomonoitalic.TTF},
		{"GoMono", pdfrender.FontStyleBoldItalic, gomonobold.TTF},
	}
	for _, f := range all {
		if err := p.AddFont(f.family, f.style, f.ttf); err != nil {
			return fmt.Errorf("add font %s %q: %w", f.family, f.style, err)
		}
	}
	return nil
}

// softBreakTextRenderer overrides the library's Text renderer, which drops
// soft line breaks entirely and glues wrapped source lines together
// ("around\n15 MB" → "around15 MB"). The library registers NodeRenderers in
// reverse priority order (renderer.go Render init loop), so LOWER priority
// registers later and wins — hence 100 vs the defaults' 1000.
type softBreakTextRenderer struct{}

func (softBreakTextRenderer) RegisterFuncs(reg pdfrender.NodeRendererFuncRegisterer) {
	reg.Register(ast.KindText, func(w *pdfrender.Writer, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}
		n := node.(*ast.Text)
		w.WriteText(string(n.Segment.Value(source)))
		if n.SoftLineBreak() || n.HardLineBreak() {
			w.WriteText(" ")
		}
		return ast.WalkContinue, nil
	})
}

// pdfCharReplacer swaps the few symbols the embedded Go fonts have no
// glyph for (mostly geometric arrows used in ASCII diagrams).
var pdfCharReplacer = strings.NewReplacer(
	"▶", ">", "◀", "<", "▸", ">", "◂", "<", "►", ">", "◄", "<",
)

// handleCMSPDF renders an article as a downloadable PDF.
// Routes: /api/cms/pdf/{folder}/{slug} and /api/cms/pdf/{slug} (bare slugs
// try the docs root first, then the blog — matching the SPA's usage).
func (s *Server) handleCMSPDF(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/cms/pdf/"), "/")
	if rest == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "slug required"})
		return
	}

	parts := strings.SplitN(rest, "/", 2)
	var a *cms.Article
	var err error
	if len(parts) == 2 {
		a, err = s.loader.Get(parts[0], parts[1])
	} else {
		a, err = s.loader.Get(s.cfg.CMS.DocsRoot, parts[0])
		if err != nil {
			a, err = s.loader.Get("blog", parts[0])
		}
	}
	if err != nil || !a.Published {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	data, err := s.renderArticlePDF(a)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "pdf render failed", "reason": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", a.Slug+".pdf"))
	w.Header().Set("Content-Length", fmt.Sprint(len(data)))
	_, _ = w.Write(data)
}

// renderArticlePDF converts an article's markdown to PDF fully offline.
func (s *Server) renderArticlePDF(a *cms.Article) ([]byte, error) {
	source := a.Raw

	// Ensure the document opens with a title, and add a byline when the
	// frontmatter carries one. Most pages already start with an H1
	// matching the title — avoid doubling it.
	var header strings.Builder
	if !strings.HasPrefix(strings.TrimSpace(source), "# ") {
		header.WriteString("# " + a.Title + "\n\n")
	}
	var byline []string
	if a.Author != "" {
		byline = append(byline, a.Author)
	}
	if !a.Date.IsZero() {
		byline = append(byline, a.Date.Format("January 2, 2006"))
	}
	if len(byline) > 0 {
		header.WriteString("*" + strings.Join(byline, " — ") + "*\n\n")
	}
	source = pdfCharReplacer.Replace(header.String() + source)

	ctx := context.Background()
	fpdfObj := pdfrender.NewFpdf(ctx, pdfrender.FpdfConfig{
		Title:   a.Title,
		Subject: a.Description,
	}, nil)
	if err := registerPDFFonts(fpdfObj); err != nil {
		return nil, err
	}

	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM, extension.Footnote, extension.Table),
		goldmark.WithRenderer(pdfrender.New(
			pdfrender.WithContext(ctx),
			pdfrender.WithPDF(fpdfObj),
			pdfrender.WithLinkColor(s.brandColor()),
			pdfrender.WithHeadingFont(pdfHeadingFont),
			pdfrender.WithBodyFont(pdfBodyFont),
			pdfrender.WithCodeFont(pdfCodeFont),
			pdfrender.WithEscapeHTML(false),
			pdfrender.WithNodeRenderers(util.Prioritized(softBreakTextRenderer{}, 100)),
		)),
	)

	var buf bytes.Buffer
	if err := md.Convert([]byte(source), &buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// brandColor parses branding.primary_hex (e.g. "#1e40af") for PDF links,
// falling back to a readable blue.
func (s *Server) brandColor() color.Color {
	hex := strings.TrimPrefix(s.cfg.Branding.PrimaryHex, "#")
	if len(hex) == 6 {
		var r, g, b uint8
		if _, err := fmt.Sscanf(hex, "%02x%02x%02x", &r, &g, &b); err == nil {
			return color.RGBA{R: r, G: g, B: b, A: 255}
		}
	}
	return color.RGBA{R: 0x1e, G: 0x40, B: 0xaf, A: 255}
}
