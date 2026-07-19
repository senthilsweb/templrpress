package server

import (
	"fmt"
	"html"
	"io/fs"
	"net/http"
	"regexp"
	"strings"
	"time"

	"templrpress/internal/cms"
)

// pageMeta holds the values injected into an HTML shell's <head> so that
// link-preview crawlers (WhatsApp, iMessage, Slack, email clients) — which
// do not execute JavaScript — see the real page title, description, and
// image instead of the generic SPA shell.
type pageMeta struct {
	Title       string
	Description string
	URL         string
	Image       string
	Type        string // "website" or "article"
	SiteName    string
	Author      string
	Published   time.Time
	Tags        []string
}

var (
	titleRe = regexp.MustCompile(`(?is)<title>.*?</title>`)
	descRe  = regexp.MustCompile(`(?i)<meta name="description" content="[^"]*"\s*/?>`)
)

// blogFolder returns the CMS folder that backs the /blog/ route.
func (s *Server) blogFolder() string {
	if s.cfg.Blog.Root != "" {
		return s.cfg.Blog.Root
	}
	return "blog"
}

// baseURL returns site.url when configured, otherwise a best-effort
// scheme+host derived from the request (honouring X-Forwarded-Proto).
func (s *Server) baseURL(r *http.Request) string {
	if u := strings.TrimRight(s.cfg.Site.URL, "/"); u != "" {
		return u
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if p := r.Header.Get("X-Forwarded-Proto"); p != "" {
		scheme = p
	}
	return scheme + "://" + r.Host
}

func absolutize(base, u string) string {
	if u == "" || strings.HasPrefix(u, "http://") || strings.HasPrefix(u, "https://") {
		return u
	}
	return base + "/" + strings.TrimPrefix(u, "/")
}

// articleFor resolves the CMS article behind an HTML shell request, when the
// shell is the docs or blog page and a ?slug= is present.
func (s *Server) articleFor(r *http.Request, htmlPath string) *cms.Article {
	var folder string
	switch htmlPath {
	case "docs/index.html":
		folder = "docs"
	case "blog/index.html":
		folder = s.blogFolder()
	default:
		return nil
	}
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		return nil
	}
	art, err := s.loader.Get(folder, slug)
	if err != nil || !art.Published {
		return nil
	}
	return art
}

// metaFor computes the meta values for an HTML shell request: site-wide
// defaults, overridden by article frontmatter when the URL identifies one.
func (s *Server) metaFor(r *http.Request, htmlPath string) pageMeta {
	site := s.cfg.Site
	base := s.baseURL(r)

	m := pageMeta{
		Title:       site.Title,
		Description: site.Description,
		Type:        "website",
		SiteName:    site.Name,
		URL:         base + r.URL.RequestURI(),
	}
	if m.Title == "" {
		m.Title = site.Name
	}
	if m.SiteName == "" {
		m.SiteName = m.Title
	}
	if logo := s.cfg.Branding.LogoURL; logo != "" {
		m.Image = absolutize(base, logo)
	}

	if art := s.articleFor(r, htmlPath); art != nil {
		m.Title = art.Title
		if m.SiteName != "" {
			m.Title = art.Title + " · " + m.SiteName
		}
		if art.Description != "" {
			m.Description = art.Description
		}
		m.Type = "article"
		m.Author = art.Author
		m.Published = art.Date
		m.Tags = art.Tags
		if art.CoverImage != "" {
			m.Image = absolutize(base, art.CoverImage)
		}
	}
	return m
}

// injectMeta rewrites the shell's <title> and description and inserts
// Open Graph + Twitter card tags before </head>.
func injectMeta(doc []byte, m pageMeta) []byte {
	title := html.EscapeString(m.Title)
	desc := html.EscapeString(m.Description)

	doc = titleRe.ReplaceAll(doc, []byte("<title>"+title+"</title>"))

	var b strings.Builder
	if m.Description != "" {
		descTag := `<meta name="description" content="` + desc + `"/>`
		if descRe.Match(doc) {
			doc = descRe.ReplaceAll(doc, []byte(descTag))
		} else {
			b.WriteString(descTag)
		}
	}

	prop := func(p, v string) {
		if v != "" {
			b.WriteString(`<meta property="` + p + `" content="` + html.EscapeString(v) + `"/>`)
		}
	}
	name := func(n, v string) {
		if v != "" {
			b.WriteString(`<meta name="` + n + `" content="` + html.EscapeString(v) + `"/>`)
		}
	}

	if m.URL != "" {
		b.WriteString(`<link rel="canonical" href="` + html.EscapeString(m.URL) + `"/>`)
	}
	prop("og:title", m.Title)
	prop("og:description", m.Description)
	prop("og:type", m.Type)
	prop("og:url", m.URL)
	prop("og:site_name", m.SiteName)
	prop("og:image", m.Image)
	if m.Type == "article" {
		prop("article:author", m.Author)
		if !m.Published.IsZero() {
			prop("article:published_time", m.Published.Format(time.RFC3339))
		}
		for _, t := range m.Tags {
			prop("article:tag", t)
		}
	}
	card := "summary"
	if m.Image != "" {
		card = "summary_large_image"
	}
	name("twitter:card", card)
	name("twitter:title", m.Title)
	name("twitter:description", m.Description)
	name("twitter:image", m.Image)

	return []byte(strings.Replace(string(doc), "</head>", b.String()+"</head>", 1))
}

// serveHTMLWithMeta serves an embedded SPA HTML shell with per-page meta
// tags injected.
func (s *Server) serveHTMLWithMeta(w http.ResponseWriter, r *http.Request, htmlPath string) {
	data, err := fs.ReadFile(s.spaSub, htmlPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	out := injectMeta(data, s.metaFor(r, htmlPath))
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write(out)
}

// spaHTMLFor maps a request path to the embedded HTML shell that serves it,
// or ok=false when the path is a non-HTML asset or does not exist.
func (s *Server) spaHTMLFor(urlPath string) (string, bool) {
	p := strings.TrimPrefix(urlPath, "/")
	switch {
	case p == "":
		p = "index.html"
	case strings.HasSuffix(p, "/"):
		p += "index.html"
	case !strings.HasSuffix(p, ".html"):
		return "", false
	}
	if _, err := fs.Stat(s.spaSub, p); err != nil {
		return "", false
	}
	return p, true
}

// handleLLMsTxt serves /llms.txt (https://llmstxt.org): a plain-markdown
// site map so LLM crawlers and coding agents can discover every docs and
// blog page, plus the JSON API, without parsing the SPA.
func (s *Server) handleLLMsTxt(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte(s.LLMsTxt(s.baseURL(r))))
}

// LLMsTxt renders the llms.txt document with the given base URL prefix.
// It is shared by the /llms.txt handler and the `templrpress llms` CLI
// subcommand so the committed and served copies never diverge.
func (s *Server) LLMsTxt(base string) string {
	site := s.cfg.Site

	nameOf := func(a, b string) string {
		if a != "" {
			return a
		}
		return b
	}

	var b strings.Builder
	fmt.Fprintf(&b, "# %s\n\n", nameOf(site.Name, site.Title))
	if site.Description != "" {
		fmt.Fprintf(&b, "> %s\n\n", site.Description)
	}

	writeSection := func(heading, folder, route string) {
		arts, err := s.loader.InFolder(folder)
		if err != nil || len(arts) == 0 {
			return
		}
		fmt.Fprintf(&b, "## %s\n\n", heading)
		for _, a := range arts {
			if !a.Published {
				continue
			}
			line := fmt.Sprintf("- [%s](%s/%s/?slug=%s)", a.Title, base, route, a.Slug)
			if a.Description != "" {
				line += ": " + a.Description
			}
			b.WriteString(line + "\n")
		}
		b.WriteString("\n")
	}
	writeSection("Docs", "docs", "docs")
	writeSection("Blog", s.blogFolder(), "blog")

	fmt.Fprintf(&b, "## API\n\n- [Content JSON API](%s/api/cms/list): every page above as JSON; individual pages at %s/api/cms/{folder}/{slug}\n", base, base)
	fmt.Fprintf(&b, "- [OpenAPI spec](%s/api/openapi-spec): machine-readable description of this site's own JSON API\n", base)

	return b.String()
}
