package server

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"runtime"
	"strings"
	"time"

	"gopkg.in/yaml.v3"

	"templrpress/internal/cms"
	"templrpress/internal/config"
)

// ---- helpers --------------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// ---- health & meta -------------------------------------------------------

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"version": s.assets.Version,
		"time":    time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) handleReadyz(w http.ResponseWriter, r *http.Request) {
	if _, err := s.loader.All(); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "not-ready", "error": err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status":   "ready",
		"version":  s.assets.Version,
		"external": s.loader.IsExternal(),
	})
}

func (s *Server) handleVersion(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"version":   s.assets.Version,
		"go":        runtime.Version(),
		"os":        runtime.GOOS,
		"arch":      runtime.GOARCH,
		"site_name": s.cfg.Site.Name,
	})
}

// ---- auth stubs -----------------------------------------------------------

func (s *Server) handleAuthStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"authenticated": false})
}

func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

// ---- config ---------------------------------------------------------------

// handleConfigBranding returns the branding config in the shape the SPA
// (templrgo-derived ConfigProvider) expects.
func (s *Server) handleConfigBranding(w http.ResponseWriter, r *http.Request) {
	b := s.cfg.Branding

	type navItem struct {
		Label    string `json:"label"`
		URL      string `json:"url,omitempty"`
		Icon     string `json:"icon,omitempty"`
		External bool   `json:"external,omitempty"`
		Subtitle string `json:"subtitle,omitempty"`
	}
	nav := make([]navItem, 0, len(s.cfg.Nav))
	for _, n := range s.cfg.Nav {
		if !n.IsEnabled() {
			continue
		}
		nav = append(nav, navItem{Label: n.Label, URL: n.URL, Icon: n.Icon, External: n.External})
	}

	branding := map[string]any{
		"app_name":          s.cfg.Site.Name,
		"page_title":        s.cfg.Site.Title,
		"page_description":  s.cfg.Site.Description,
		"logo_mark":         firstNonEmpty(b.LogoText, s.cfg.Site.Name),
		"logo_url":          b.LogoURL,
		"logo_dark_url":     b.LogoDarkURL,
		"favicon_url":       firstNonEmpty(b.FaviconURL, "/static/favicon.svg"),
		"github_url":        b.GitHubURL,
		"navigation":        nav,
		"hero_title":        firstNonEmpty(b.HeroHeading, s.cfg.Site.Title),
		"hero_tagline":      b.HeroTagline,
		"hero_image_url":    "",
		"service_endpoints": []any{},

		"hero_badge":              b.HeroBadge,
		"hero_heading":            b.HeroHeading,
		"hero_heading_highlight":  b.HeroHighlight,
		"hero_heading_suffix":     b.HeroSuffix,
		"hero_cta_primary_text":   b.HeroCTAText,
		"hero_cta_primary_url":    b.HeroCTAURL,
		"hero_cta_secondary_text": b.HeroCTA2Text,
		"hero_cta_secondary_url":  b.HeroCTA2URL,

		"footer_credit_prefix":    s.cfg.Footer.CreditPrefix,
		"footer_credit_link_text": s.cfg.Footer.CreditText,
		"footer_credit_link_url":  s.cfg.Footer.CreditURL,
		"footer_cta_tagline":      s.cfg.Footer.CTATagline,
		"footer_cta_primary":      s.cfg.Footer.CTAPrimary,
		"footer_cta_secondary":    s.cfg.Footer.CTASecondary,
		"footer_cta_button_text":  s.cfg.Footer.CTAButtonText,
		"footer_cta_button_url":   s.cfg.Footer.CTAButtonURL,
		"footer_tagline":          s.cfg.Footer.Tagline,
		"footer_enabled":          s.cfg.Footer.Enabled,
		"footer_columns":          s.cfg.Footer.Columns,
	}
	writeJSON(w, http.StatusOK, map[string]any{"branding": branding})
}

func (s *Server) handleConfigServers(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"opensearch_servers":  []any{},
		"mongodb_servers":     []any{},
		"postgres_servers":    []any{},
		"mysql_servers":       []any{},
		"openobserve_servers": []any{},
	})
}

func (s *Server) handleOpenAPISpecsList(w http.ResponseWriter, r *http.Request) {
	hasUserDefault := false
	for _, e := range s.cfg.OpenAPISpecs {
		if e.IsDefault {
			hasUserDefault = true
			break
		}
	}
	items := []map[string]any{
		{
			"name":        "_builtin",
			"description": firstNonEmpty(s.cfg.APIDocs.Title, "TemplrPress API"),
			"default":     !hasUserDefault,
		},
	}
	for _, e := range s.cfg.OpenAPISpecs {
		if e.Name == "" || e.URL == "" {
			continue
		}
		items = append(items, map[string]any{
			"name":        e.Name,
			"description": e.Description,
			"default":     e.IsDefault,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "total": len(items)})
}

// handleOpenAPISpec serves an OpenAPI document as JSON. ?spec=<name> selects
// from the registry; missing/_builtin returns the embedded TemplrPress spec.
// YAML files are unmarshalled and re-emitted as JSON so the SPA's react-query
// client (which always calls res.json()) can consume the response.
func (s *Server) handleOpenAPISpec(w http.ResponseWriter, r *http.Request) {
	staticSub, err := fs.Sub(s.assets.Static, "static")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	specName := r.URL.Query().Get("spec")
	if specName == "" || specName == "_builtin" {
		s.serveBuiltinSpec(w, staticSub)
		return
	}

	for _, e := range s.cfg.OpenAPISpecs {
		if e.Name != specName {
			continue
		}
		rel := strings.TrimPrefix(e.URL, "/")
		rel = strings.TrimPrefix(rel, "static/")
		data, err := fs.ReadFile(staticSub, rel)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "spec file not found", "reason": err.Error()})
			return
		}
		s.writeSpecAsJSON(w, rel, data)
		return
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown spec", "reason": "name not in registry: " + specName})
}

func (s *Server) serveBuiltinSpec(w http.ResponseWriter, staticSub fs.FS) {
	if d, e := fs.ReadFile(staticSub, "openapi.json"); e == nil {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(d)
		return
	}
	data, err := fs.ReadFile(staticSub, "openapi.yaml")
	if err != nil {
		http.Error(w, "openapi spec not found", http.StatusNotFound)
		return
	}
	s.writeSpecAsJSON(w, "openapi.yaml", data)
}

func (s *Server) writeSpecAsJSON(w http.ResponseWriter, rel string, data []byte) {
	low := strings.ToLower(rel)
	if strings.HasSuffix(low, ".json") {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(data)
		return
	}
	var doc any
	if err := yaml.Unmarshal(data, &doc); err != nil {
		http.Error(w, "openapi spec parse: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, normalizeYAMLForJSON(doc))
}

// normalizeYAMLForJSON walks a value decoded from YAML and converts
// map[interface{}]interface{} into map[string]any so encoding/json can
// marshal it without error.
func normalizeYAMLForJSON(v any) any {
	switch x := v.(type) {
	case map[any]any:
		m := make(map[string]any, len(x))
		for k, val := range x {
			m[fmt.Sprint(k)] = normalizeYAMLForJSON(val)
		}
		return m
	case map[string]any:
		for k, val := range x {
			x[k] = normalizeYAMLForJSON(val)
		}
		return x
	case []any:
		for i, val := range x {
			x[i] = normalizeYAMLForJSON(val)
		}
		return x
	}
	return v
}

// ---- CMS ------------------------------------------------------------------

type frontmatterOut struct {
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Date        time.Time `json:"date,omitempty"`
	Author      string    `json:"author,omitempty"`
	Type        string    `json:"type,omitempty"`
	Category    string    `json:"category,omitempty"`
	Tags        []string  `json:"tags,omitempty"`
	CoverImage  string    `json:"coverImage,omitempty"`
	Folder      string    `json:"folder,omitempty"`
	URL         string    `json:"url,omitempty"`
	SortOrder   int       `json:"sortOrder,omitempty"`
}

func articleFrontmatter(a *cms.Article, kind string) frontmatterOut {
	return frontmatterOut{
		Title:       a.Title,
		Slug:        a.Slug,
		Description: a.Description,
		Date:        a.Date,
		Author:      a.Author,
		Type:        kind,
		Category:    a.Category,
		Tags:        a.Tags,
		CoverImage:  a.CoverImage,
		Folder:      a.Folder,
		URL:         "/" + a.Folder + "/" + a.Slug,
		SortOrder:   a.SortOrder,
	}
}

// /api/cms/docs/nav — sidebar tree for the docs page.
func (s *Server) handleDocsNav(w http.ResponseWriter, r *http.Request) {
	docs, err := s.loader.InFolder(s.cfg.Content.DocsRoot)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	type item struct {
		Title       string `json:"title"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		Folder      string `json:"folder"`
		SortOrder   int    `json:"sortOrder"`
	}
	type section struct {
		Folder string `json:"folder"`
		Label  string `json:"label"`
		Items  []item `json:"items"`
	}
	type flat struct {
		Folder string `json:"folder"`
		Slug   string `json:"slug"`
	}

	rootItems := []item{}
	sectionMap := map[string]*section{}
	order := []string{}
	flatOrder := []flat{}

	for _, a := range docs {
		flatOrder = append(flatOrder, flat{Folder: a.Folder, Slug: a.Slug})
		it := item{Title: a.Title, Slug: a.Slug, Description: a.Description, Folder: a.Folder, SortOrder: a.SortOrder}
		sec := a.Section
		if sec == "" {
			rootItems = append(rootItems, it)
			continue
		}
		if _, ok := sectionMap[sec]; !ok {
			order = append(order, sec)
			sectionMap[sec] = &section{Folder: sec, Label: humanizeSection(sec), Items: []item{}}
		}
		sectionMap[sec].Items = append(sectionMap[sec].Items, it)
	}

	sections := make([]section, 0, len(order))
	for _, k := range order {
		sections = append(sections, *sectionMap[k])
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"sections":  sections,
		"rootItems": rootItems,
		"flatOrder": flatOrder,
	})
}

// /api/cms/list?type=about — list articles in a folder.
func (s *Server) handleCMSList(w http.ResponseWriter, r *http.Request) {
	kind := r.URL.Query().Get("type")
	folder := kind
	if folder == "" {
		folder = "docs"
	}

	articles, err := s.loader.InFolder(folder)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	out := make([]frontmatterOut, 0, len(articles))
	for _, a := range articles {
		out = append(out, articleFrontmatter(a, kind))
	}

	// Fallback: if `type=about` is requested but content/about/ is empty,
	// expose the legacy single-file `content/about.md` as one entry.
	if kind == "about" && len(out) == 0 {
		if a, err := s.loader.GetByPath(s.cfg.Content.AboutFile); err == nil {
			a.Folder = "about"
			out = append(out, articleFrontmatter(a, "about"))
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"articles": out})
}

// /api/cms/about/{slug} — single about article.
func (s *Server) handleAboutGet(w http.ResponseWriter, r *http.Request) {
	slug := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/cms/about/"), "/")
	if slug == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "slug required"})
		return
	}

	if a, err := s.loader.Get("about", slug); err == nil && a.Published {
		s.writeArticle(w, a, "about")
		return
	}

	// Legacy single-file fallback for default about slug.
	if a, err := s.loader.GetByPath(s.cfg.Content.AboutFile); err == nil {
		if a.Slug == slug || slug == strings.TrimSuffix(s.cfg.Content.AboutFile, ".md") {
			a.Folder = "about"
			s.writeArticle(w, a, "about")
			return
		}
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

// /api/cms/{folder}/{slug} or /api/cms/{slug}
func (s *Server) handleCMSArticle(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/api/cms/")
	rest = strings.Trim(rest, "/")
	if rest == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "slug required"})
		return
	}
	parts := strings.SplitN(rest, "/", 2)
	var folder, slug string
	if len(parts) == 2 {
		folder, slug = parts[0], parts[1]
	} else {
		folder, slug = s.cfg.Content.DocsRoot, parts[0]
	}
	a, err := s.loader.Get(folder, slug)
	if err != nil || !a.Published {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	s.writeArticle(w, a, folder)
}

func (s *Server) writeArticle(w http.ResponseWriter, a *cms.Article, kind string) {
	writeJSON(w, http.StatusOK, map[string]any{
		"frontmatter": articleFrontmatter(a, kind),
		"content":     a.Raw,
		"html":        a.HTML,
	})
}

// ---- misc -----------------------------------------------------------------

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// keep config import warning at bay if we later drop branding usage
var _ = config.Config{}
