package server

import (
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"strings"
	"sync"
	"time"

	"templrpress/internal/config"
)

type templateBundle struct {
	once sync.Once
	tpl  *template.Template
	err  error
}

func newFuncs() template.FuncMap {
	return template.FuncMap{
		"safeHTML":   func(s string) template.HTML { return template.HTML(s) },
		"year":       func() int { return time.Now().Year() },
		"hasPrefix":  strings.HasPrefix,
		"trimPrefix": strings.TrimPrefix,
		"date": func(t time.Time, layout string) string {
			if t.IsZero() {
				return ""
			}
			return t.Format(layout)
		},
	}
}

func loadTemplates(efs embed.FS) (*template.Template, error) {
	if _, err := efs.ReadFile("templates/base.html"); err != nil {
		return nil, fmt.Errorf("base.html: %w", err)
	}
	return template.New("").Funcs(newFuncs()), nil
}

func (s *Server) bundleFor(name string) (*template.Template, error) {
	s.tplMu.Lock()
	b, ok := s.tplCache[name]
	if !ok {
		b = &templateBundle{}
		s.tplCache[name] = b
	}
	s.tplMu.Unlock()

	b.once.Do(func() {
		patterns := []string{"templates/base.html"}
		entries, err := fs.ReadDir(s.assets.Templates, "templates/partials")
		if err == nil {
			for _, e := range entries {
				if !e.IsDir() && strings.HasSuffix(e.Name(), ".html") {
					patterns = append(patterns, "templates/partials/"+e.Name())
				}
			}
		}
		patterns = append(patterns, "templates/"+name)
		t, perr := template.New("base.html").Funcs(newFuncs()).ParseFS(s.assets.Templates, patterns...)
		b.tpl = t
		b.err = perr
	})
	return b.tpl, b.err
}

func (s *Server) render(w http.ResponseWriter, r *http.Request, name string, data map[string]any) {
	if data == nil {
		data = map[string]any{}
	}
	data["Site"] = s.cfg.Site
	data["Branding"] = s.cfg.Branding
	data["Footer"] = s.cfg.Footer
	data["Nav"] = filterNav(s.cfg.Nav)
	data["BlogEnabled"] = s.cfg.Blog.Enabled
	data["APIDocsEnabled"] = s.cfg.APIDocs.Enabled
	data["Version"] = s.assets.Version
	data["Path"] = r.URL.Path
	data["Page"] = name

	tpl, err := s.bundleFor(name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tpl.ExecuteTemplate(w, "base.html", data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func filterNav(items []config.NavItem) []config.NavItem {
	out := make([]config.NavItem, 0, len(items))
	for _, it := range items {
		if !it.IsEnabled() {
			continue
		}
		it.Children = filterNav(it.Children)
		out = append(out, it)
	}
	return out
}

var _ embed.FS // keep embed import (unused at top-level here but referenced in Assets)
