package server

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"templrpress/internal/cms"
	"templrpress/internal/config"
)

type Assets struct {
	SPA     embed.FS
	Static  embed.FS
	Content embed.FS
	Version string
}

type Server struct {
	cfg    *config.Config
	assets Assets
	loader *cms.Loader
	spaSub fs.FS
}

func New(cfg *config.Config, assets Assets) (*Server, error) {
	loader := cms.New(assets.Content, "content", cfg.Content.Source)

	// SPA root: templrpress-nextjs/out (static export)
	spaSub, err := fs.Sub(assets.SPA, "templrpress-nextjs/out")
	if err != nil {
		return nil, fmt.Errorf("spa subFS: %w", err)
	}
	return &Server{cfg: cfg, assets: assets, loader: loader, spaSub: spaSub}, nil
}

func (s *Server) Run() error {
	mux := http.NewServeMux()
	s.routes(mux)
	addr := fmt.Sprintf("%s:%d", s.cfg.Server.Host, s.cfg.Server.Port)
	fmt.Printf("listening on http://%s\n", addr)
	return http.ListenAndServe(addr, logRequests(mux))
}

func (s *Server) routes(mux *http.ServeMux) {
	// embedded /static/* (favicon, openapi spec, etc.)
	staticSub, _ := fs.Sub(s.assets.Static, "static")
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticSub))))

	// health & meta
	mux.HandleFunc("/healthz", s.handleHealthz)
	mux.HandleFunc("/readyz", s.handleReadyz)
	mux.HandleFunc("/api/version", s.handleVersion)

	// auth stubs
	mux.HandleFunc("/api/auth/status", s.handleAuthStatus)
	mux.HandleFunc("/api/auth/logout", s.handleAuthLogout)

	// config
	mux.HandleFunc("/api/config/branding", s.handleConfigBranding)
	mux.HandleFunc("/api/config/servers", s.handleConfigServers)
	mux.HandleFunc("/api/config/openapi-specs", s.handleOpenAPISpecsList)
	mux.HandleFunc("/api/openapi-spec", s.handleOpenAPISpec)

	// CMS
	mux.HandleFunc("/api/cms/docs/nav", s.handleDocsNav)
	mux.HandleFunc("/api/cms/list", s.handleCMSList)
	mux.HandleFunc("/api/cms/about/", s.handleAboutGet)
	// /api/cms/{folder}/{slug} or /api/cms/{slug}
	mux.HandleFunc("/api/cms/", s.handleCMSArticle)

	// SPA (must be last; "/" matches everything not above)
	mux.Handle("/", s.spaHandler())
}

// spaHandler serves files from the embedded Next.js export. For directory
// routes (e.g. /docs/) it returns the matching index.html. Unknown paths
// fall back to /404.html when present, otherwise a plain 404.
func (s *Server) spaHandler() http.Handler {
	fileServer := http.FileServer(http.FS(s.spaSub))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Redirect /api/* misses to JSON 404 (defensive).
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		// Try the file as-is.
		if s.spaFileExists(r.URL.Path) {
			fileServer.ServeHTTP(w, r)
			return
		}
		// Try /path/index.html (for trailing-slash-less requests).
		if !strings.HasSuffix(r.URL.Path, "/") {
			if s.spaFileExists(r.URL.Path + "/index.html") {
				http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
				return
			}
		}
		// Fallback: serve 404.html if present, else default.
		if data, err := fs.ReadFile(s.spaSub, "404.html"); err == nil {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write(data)
			return
		}
		http.NotFound(w, r)
	})
}

func (s *Server) spaFileExists(p string) bool {
	p = strings.TrimPrefix(p, "/")
	if p == "" {
		p = "index.html"
	}
	if _, err := fs.Stat(s.spaSub, p); err == nil {
		return true
	}
	// trailing slash → look for index.html
	if strings.HasSuffix(p, "/") {
		if _, err := fs.Stat(s.spaSub, p+"index.html"); err == nil {
			return true
		}
	}
	return false
}

func logRequests(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(w, r)
		fmt.Printf("%s %s %s (%s)\n", time.Now().Format("15:04:05"), r.Method, r.URL.Path, time.Since(start))
	})
}

// ---- helpers shared with api.go ------------------------------------------

func humanizeSection(s string) string {
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
