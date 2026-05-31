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

	"templrpress/internal/cms"
	"templrpress/internal/config"
)

type Assets struct {
	Templates embed.FS
	Static    embed.FS
	Content   embed.FS
	Version   string
}

type Server struct {
	cfg    *config.Config
	assets Assets
	tpl    *template.Template
	loader *cms.Loader

	tplMu    sync.Mutex
	tplCache map[string]*templateBundle
}

func New(cfg *config.Config, assets Assets) (*Server, error) {
	tpl, err := loadTemplates(assets.Templates)
	if err != nil {
		return nil, fmt.Errorf("templates: %w", err)
	}
	loader := cms.New(assets.Content, "content", cfg.Content.Source)
	return &Server{
		cfg:      cfg,
		assets:   assets,
		tpl:      tpl,
		loader:   loader,
		tplCache: map[string]*templateBundle{},
	}, nil
}

func (s *Server) Run() error {
	mux := http.NewServeMux()
	s.routes(mux)
	addr := fmt.Sprintf("%s:%d", s.cfg.Server.Host, s.cfg.Server.Port)
	fmt.Printf("listening on http://%s\n", addr)
	return http.ListenAndServe(addr, logRequests(mux))
}

func (s *Server) routes(mux *http.ServeMux) {
	// static files (embedded /static/*)
	staticSub, _ := fs.Sub(s.assets.Static, "static")
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticSub))))

	// health & meta
	mux.HandleFunc("/healthz", s.handleHealthz)
	mux.HandleFunc("/readyz", s.handleReadyz)
	mux.HandleFunc("/api/version", s.handleVersion)

	// CMS JSON API
	mux.HandleFunc("/api/cms/articles", s.handleArticlesList)
	mux.HandleFunc("/api/cms/article/", s.handleArticleGet)
	mux.HandleFunc("/api/cms/sections", s.handleSections)

	// pages
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/about", s.handleAbout)
	mux.HandleFunc("/settings", s.handleSettings)
	mux.HandleFunc("/docs", s.handleDocsIndex)
	mux.HandleFunc("/docs/", s.handleDoc)

	if s.cfg.Blog.Enabled {
		mux.HandleFunc("/blog", s.handleBlogIndex)
		mux.HandleFunc("/blog/", s.handleBlogPost)
	}
	if s.cfg.APIDocs.Enabled {
		mux.HandleFunc("/api-docs", s.handleAPIDocs)
	}
}

func (s *Server) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		s.notFound(w, r)
		return
	}
	s.render(w, r, "landing.html", map[string]any{})
}

func (s *Server) handleAbout(w http.ResponseWriter, r *http.Request) {
	a, err := s.loader.GetByPath(s.cfg.Content.AboutFile)
	if err != nil {
		s.notFound(w, r)
		return
	}
	s.render(w, r, "about.html", map[string]any{"Article": a})
}

func (s *Server) handleDocsIndex(w http.ResponseWriter, r *http.Request) {
	docs, _ := s.loader.InFolder(s.cfg.Content.DocsRoot)
	groups := groupBySection(docs)
	// Redirect to first doc if any
	if len(docs) > 0 {
		http.Redirect(w, r, "/docs/"+docs[0].Slug+pathFromSection(docs[0]), http.StatusFound)
		return
	}
	s.render(w, r, "docs.html", map[string]any{
		"Groups":  groups,
		"Article": nil,
	})
}

func (s *Server) handleDoc(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/docs/")
	slug = strings.Trim(slug, "/")
	if slug == "" {
		s.handleDocsIndex(w, r)
		return
	}
	// slug may include section like "01-getting-started/welcome" — take last segment
	parts := strings.Split(slug, "/")
	target := parts[len(parts)-1]

	docs, _ := s.loader.InFolder(s.cfg.Content.DocsRoot)
	var article *cms.Article
	for _, a := range docs {
		if a.Slug == target {
			article = a
			break
		}
	}
	if article == nil {
		s.notFound(w, r)
		return
	}
	groups := groupBySection(docs)
	s.render(w, r, "doc.html", map[string]any{
		"Groups":  groups,
		"Article": article,
	})
}

func (s *Server) handleBlogIndex(w http.ResponseWriter, r *http.Request) {
	posts, _ := s.loader.InFolder(s.cfg.Blog.Root)
	s.render(w, r, "blog.html", map[string]any{"Posts": posts})
}

func (s *Server) handleBlogPost(w http.ResponseWriter, r *http.Request) {
	slug := strings.Trim(strings.TrimPrefix(r.URL.Path, "/blog/"), "/")
	if slug == "" {
		s.handleBlogIndex(w, r)
		return
	}
	a, err := s.loader.Get(s.cfg.Blog.Root, slug)
	if err != nil || !a.Published {
		s.notFound(w, r)
		return
	}
	s.render(w, r, "post.html", map[string]any{"Post": a})
}

func (s *Server) handleAPIDocs(w http.ResponseWriter, r *http.Request) {
	s.render(w, r, "api.html", map[string]any{
		"SpecURL": s.cfg.APIDocs.SpecURL,
		"Title":   s.cfg.APIDocs.Title,
	})
}

func (s *Server) notFound(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	s.render(w, r, "404.html", map[string]any{"Path": r.URL.Path})
}

// pathFromSection returns the section subpath segment for nicer URLs (currently unused; flat slugs).
func pathFromSection(_ *cms.Article) string { return "" }

// groupBySection produces an ordered list of (section -> articles).
func groupBySection(articles []*cms.Article) []SectionGroup {
	type key struct {
		section string
		order   int
	}
	idx := map[string]int{}
	var keys []string
	groups := map[string][]*cms.Article{}
	for _, a := range articles {
		sec := a.Section
		if sec == "" {
			sec = "General"
		}
		if _, ok := idx[sec]; !ok {
			idx[sec] = len(keys)
			keys = append(keys, sec)
		}
		groups[sec] = append(groups[sec], a)
	}
	out := make([]SectionGroup, 0, len(keys))
	for _, k := range keys {
		out = append(out, SectionGroup{Title: humanizeSection(k), Articles: groups[k]})
	}
	return out
}

type SectionGroup struct {
	Title    string
	Articles []*cms.Article
}

func humanizeSection(s string) string {
	// strip leading "NN-" prefix and title-case
	if len(s) > 3 && s[2] == '-' && s[0] >= '0' && s[0] <= '9' {
		s = s[3:]
	}
	parts := strings.Split(s, "-")
	for i, p := range parts {
		if p == "" {
			continue
		}
		parts[i] = strings.ToUpper(p[:1]) + p[1:]
	}
	return strings.Join(parts, " ")
}

func logRequests(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(w, r)
		fmt.Printf("%s %s %s (%s)\n", time.Now().Format("15:04:05"), r.Method, r.URL.Path, time.Since(start))
	})
}
