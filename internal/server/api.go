package server

import (
	"encoding/json"
	"net/http"
	"runtime"
	"strings"
	"time"
)

// ---- JSON helpers --------------------------------------------------------

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
	// Verify content loader can scan without error.
	_, err := s.loader.All()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "not-ready",
			"error":  err.Error(),
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

// ---- CMS JSON API --------------------------------------------------------

// articleSummary trims the full Article for list responses.
type articleSummary struct {
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Date        time.Time `json:"date,omitempty"`
	Author      string    `json:"author,omitempty"`
	Category    string    `json:"category,omitempty"`
	Tags        []string  `json:"tags,omitempty"`
	Folder      string    `json:"folder"`
	Section     string    `json:"section,omitempty"`
	SortOrder   int       `json:"sort_order,omitempty"`
	URL         string    `json:"url"`
}

func (s *Server) handleArticlesList(w http.ResponseWriter, r *http.Request) {
	folder := r.URL.Query().Get("folder")
	all, err := s.loader.All()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	out := make([]articleSummary, 0, len(all))
	for _, a := range all {
		if !a.Published {
			continue
		}
		if folder != "" && a.Folder != folder {
			continue
		}
		out = append(out, articleSummary{
			Title:       a.Title,
			Slug:        a.Slug,
			Description: a.Description,
			Date:        a.Date,
			Author:      a.Author,
			Category:    a.Category,
			Tags:        a.Tags,
			Folder:      a.Folder,
			Section:     a.Section,
			SortOrder:   a.SortOrder,
			URL:         "/" + a.Folder + "/" + a.Slug,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"items": out,
		"total": len(out),
	})
}

// /api/cms/article/{folder}/{slug}
func (s *Server) handleArticleGet(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/api/cms/article/")
	rest = strings.Trim(rest, "/")
	if rest == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "folder and slug required"})
		return
	}
	parts := strings.SplitN(rest, "/", 2)
	if len(parts) < 2 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "expected /api/cms/article/{folder}/{slug}"})
		return
	}
	folder, slug := parts[0], parts[1]
	a, err := s.loader.Get(folder, slug)
	if err != nil || !a.Published {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"title":       a.Title,
		"slug":        a.Slug,
		"description": a.Description,
		"date":        a.Date,
		"author":      a.Author,
		"category":    a.Category,
		"tags":        a.Tags,
		"folder":      a.Folder,
		"section":     a.Section,
		"sort_order":  a.SortOrder,
		"html":        a.HTML,
		"raw":         a.Raw,
	})
}

// /api/cms/sections — grouped sidebar payload for a folder (default: docs)
func (s *Server) handleSections(w http.ResponseWriter, r *http.Request) {
	folder := r.URL.Query().Get("folder")
	if folder == "" {
		folder = s.cfg.Content.DocsRoot
	}
	articles, err := s.loader.InFolder(folder)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	groups := groupBySection(articles)
	type item struct {
		Title string `json:"title"`
		Slug  string `json:"slug"`
		URL   string `json:"url"`
	}
	type group struct {
		Title    string `json:"title"`
		Articles []item `json:"articles"`
	}
	out := make([]group, 0, len(groups))
	for _, g := range groups {
		items := make([]item, 0, len(g.Articles))
		for _, a := range g.Articles {
			items = append(items, item{Title: a.Title, Slug: a.Slug, URL: "/" + a.Folder + "/" + a.Slug})
		}
		out = append(out, group{Title: g.Title, Articles: items})
	}
	writeJSON(w, http.StatusOK, map[string]any{"folder": folder, "groups": out})
}

// ---- settings (dummy placeholder) ---------------------------------------

func (s *Server) handleSettings(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "settings.html", map[string]any{})
}
