// Package cms loads markdown content (with YAML frontmatter) from either
// an embedded filesystem or an on-disk directory and renders it to HTML.
package cms

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
	"gopkg.in/yaml.v3"
)

// Article holds frontmatter + rendered HTML.
type Article struct {
	Title       string    `yaml:"title"`
	NavTitle    string    `yaml:"nav_title"`
	Slug        string    `yaml:"slug"`
	Description string    `yaml:"description"`
	Date        time.Time `yaml:"date"`
	DateRaw     string    `yaml:"-"`
	Published   bool      `yaml:"published"`
	Author      string    `yaml:"author"`
	Category    string    `yaml:"category"`
	Tags        []string  `yaml:"tags"`
	CoverImage  string    `yaml:"cover_image"`
	SortOrder   int       `yaml:"sort_order"`

	// Path returns the relative file path under the content root, e.g. "docs/01/welcome.md"
	Path    string `yaml:"-"`
	Folder  string `yaml:"-"` // top-level subfolder (e.g. "docs", "blog") or "" for root
	Section string `yaml:"-"` // the immediate parent dir below Folder (e.g. "01-getting-started")
	HTML    string `yaml:"-"`
	Raw     string `yaml:"-"`
}

// frontmatterRaw lets us be lenient about Date being a string or full timestamp.
type frontmatterRaw struct {
	Title       string   `yaml:"title"`
	NavTitle    string   `yaml:"nav_title"`
	Slug        string   `yaml:"slug"`
	Description string   `yaml:"description"`
	Date        string   `yaml:"date"`
	Published   *bool    `yaml:"published"`
	Author      string   `yaml:"author"`
	Category    string   `yaml:"category"`
	Tags        []string `yaml:"tags"`
	CoverImage  string   `yaml:"cover_image"`
	SortOrder   int      `yaml:"sort_order"`
}

// Loader scans, parses and caches articles.
// Source is one place to scan for markdown files.
type Source struct {
	FS       fs.FS  // filesystem to walk
	Root     string // path inside the FS (typically "." or "content")
	External bool   // true when read from disk (no caching, picks up edits live)
}

// Loader scans, parses and caches articles from one or more sources.
type Loader struct {
	sources         []Source          // primary stack; earlier entries win on dedupe
	folderOverrides map[string]Source // per-folder REPLACE mode (only this source for that folder)

	md goldmark.Markdown

	mu       sync.RWMutex
	cache    []*Article
	cacheSet bool
}

// New keeps the original two-argument constructor: embedded + optional
// external dir (whole-tree union). External (if present) takes priority
// over embedded on path collision. For per-folder REPLACE overrides use
// NewMulti.
func New(embeddedFS fs.FS, embeddedRoot, externalDir string) *Loader {
	var sources []Source
	if externalDir != "" {
		if info, err := os.Stat(externalDir); err == nil && info.IsDir() {
			sources = append(sources, Source{FS: os.DirFS(externalDir), Root: ".", External: true})
		}
	}
	if sub, err := fs.Sub(embeddedFS, embeddedRoot); err == nil {
		sources = append(sources, Source{FS: sub, Root: "."})
	} else {
		sources = append(sources, Source{FS: embeddedFS, Root: embeddedRoot})
	}
	return NewMulti(sources, nil)
}

// NewMulti builds a Loader from an ordered list of sources plus optional
// per-folder REPLACE overrides. For any folder name listed in overrides,
// the primary sources are skipped and only the override is scanned for
// that folder — mirrors templrgo's `cms.folders.<name>.source` behaviour.
func NewMulti(sources []Source, folderOverrides map[string]Source) *Loader {
	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM, extension.Footnote, extension.Table),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		goldmark.WithRendererOptions(html.WithUnsafe()),
	)
	if folderOverrides == nil {
		folderOverrides = map[string]Source{}
	}
	return &Loader{md: md, sources: sources, folderOverrides: folderOverrides}
}

// IsExternal reports whether any source is read from disk. True means
// caching is disabled and edits show up on the next request.
func (l *Loader) IsExternal() bool {
	for _, s := range l.sources {
		if s.External {
			return true
		}
	}
	for _, s := range l.folderOverrides {
		if s.External {
			return true
		}
	}
	return false
}

// All scans every active source and returns merged, sorted articles.
// Earlier sources win on folder/slug collision (embedded primary > external
// secondary in union mode); folder overrides REPLACE that folder entirely.
// In external mode the cache is bypassed so edits are visible immediately.
func (l *Loader) All() ([]*Article, error) {
	if !l.IsExternal() {
		l.mu.RLock()
		if l.cacheSet {
			out := append([]*Article(nil), l.cache...)
			l.mu.RUnlock()
			return out, nil
		}
		l.mu.RUnlock()
	}

	out, err := l.scan()
	if err != nil {
		return nil, err
	}
	if !l.IsExternal() {
		l.mu.Lock()
		l.cache = append([]*Article(nil), out...)
		l.cacheSet = true
		l.mu.Unlock()
	}
	return out, nil
}

func (l *Loader) scan() ([]*Article, error) {
	seen := map[string]bool{} // dedupe key: folder/slug
	var out []*Article

	// 1) Walk primary sources (in priority order). Folders that have an
	//    override are skipped here so REPLACE mode kicks in below.
	for _, src := range l.sources {
		arts, err := l.scanSource(src)
		if err != nil {
			return nil, err
		}
		for _, a := range arts {
			if _, overridden := l.folderOverrides[a.Folder]; overridden {
				continue
			}
			key := a.Folder + "/" + a.Slug
			if seen[key] {
				continue
			}
			seen[key] = true
			out = append(out, a)
		}
	}

	// 2) Walk per-folder REPLACE overrides.
	for folder, src := range l.folderOverrides {
		arts, err := l.scanSource(src)
		if err != nil {
			return nil, err
		}
		for _, a := range arts {
			// Override sources are scanned at their own root, so the path
			// is `<section>/<file>.md` (or just `<file>.md`). Re-derive
			// Folder/Section so REPLACE mode matches embedded UNION mode.
			parts := strings.Split(a.Path, "/")
			a.Folder = folder
			if len(parts) >= 2 {
				a.Section = parts[0]
			} else {
				a.Section = ""
			}
			key := a.Folder + "/" + a.Slug
			if seen[key] {
				continue
			}
			seen[key] = true
			out = append(out, a)
		}
	}

	sortArticles(out)
	return out, nil
}

func (l *Loader) scanSource(src Source) ([]*Article, error) {
	var root fs.FS = src.FS
	if src.Root != "" && src.Root != "." {
		sub, err := fs.Sub(src.FS, src.Root)
		if err == nil {
			root = sub
		}
	}
	var out []*Article
	err := fs.WalkDir(root, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(p), ".md") {
			return nil
		}
		a, err := l.loadFileFrom(root, p)
		if err != nil {
			fmt.Fprintf(os.Stderr, "cms: skip %s: %v\n", p, err)
			return nil
		}
		out = append(out, a)
		return nil
	})
	return out, err
}

func (l *Loader) loadFile(p string) (*Article, error) {
	// Read from the first source that has the file.
	for _, src := range l.sources {
		var root fs.FS = src.FS
		if src.Root != "" && src.Root != "." {
			if sub, err := fs.Sub(src.FS, src.Root); err == nil {
				root = sub
			}
		}
		if a, err := l.loadFileFrom(root, p); err == nil {
			return a, nil
		}
	}
	return nil, fmt.Errorf("not found: %s", p)
}

func (l *Loader) loadFileFrom(root fs.FS, p string) (*Article, error) {
	data, err := fs.ReadFile(root, p)
	if err != nil {
		return nil, err
	}
	fm, body := splitFrontmatter(data)
	var raw frontmatterRaw
	if len(fm) > 0 {
		if err := yaml.Unmarshal(fm, &raw); err != nil {
			return nil, fmt.Errorf("frontmatter: %w", err)
		}
	}

	a := &Article{
		Title:       raw.Title,
		NavTitle:    raw.NavTitle,
		Slug:        raw.Slug,
		Description: raw.Description,
		DateRaw:     raw.Date,
		Author:      raw.Author,
		Category:    raw.Category,
		Tags:        raw.Tags,
		CoverImage:  raw.CoverImage,
		SortOrder:   raw.SortOrder,
		Published:   raw.Published == nil || *raw.Published,
		Path:        p,
		Raw:         string(body),
	}
	if t, ok := parseDate(raw.Date); ok {
		a.Date = t
	}
	if a.Slug == "" {
		base := path.Base(p)
		a.Slug = strings.TrimSuffix(base, path.Ext(base))
	}
	if a.Title == "" {
		a.Title = humanize(a.Slug)
	}

	parts := strings.Split(p, "/")
	if len(parts) >= 1 {
		a.Folder = parts[0]
	}
	if len(parts) >= 3 {
		a.Section = parts[1]
	}

	var buf bytes.Buffer
	if err := l.md.Convert(body, &buf); err != nil {
		return nil, fmt.Errorf("markdown: %w", err)
	}
	a.HTML = buf.String()
	return a, nil
}

// Get returns a single article by folder + slug. Folder may be empty for root files.
func (l *Loader) Get(folder, slug string) (*Article, error) {
	all, err := l.All()
	if err != nil {
		return nil, err
	}
	for _, a := range all {
		if a.Slug == slug && (folder == "" || a.Folder == folder) {
			return a, nil
		}
	}
	return nil, fmt.Errorf("not found: %s/%s", folder, slug)
}

// GetByPath loads a single file directly from a relative path (e.g. "about.md").
// Bypasses the published filter and slug logic — used for one-off pages like /about.
func (l *Loader) GetByPath(rel string) (*Article, error) {
	return l.loadFile(rel)
}

// InFolder returns published articles inside the given top-level folder, sorted.
func (l *Loader) InFolder(folder string) ([]*Article, error) {
	all, err := l.All()
	if err != nil {
		return nil, err
	}
	out := make([]*Article, 0, len(all))
	for _, a := range all {
		if a.Folder == folder && a.Published {
			out = append(out, a)
		}
	}
	return out, nil
}

// splitFrontmatter extracts YAML frontmatter delimited by `---` lines.
func splitFrontmatter(data []byte) (fm, body []byte) {
	if !bytes.HasPrefix(data, []byte("---")) {
		return nil, data
	}
	rest := data[3:]
	// allow optional trailing newline after opening ---
	rest = bytes.TrimLeft(rest, "\r\n")
	end := bytes.Index(rest, []byte("\n---"))
	if end < 0 {
		return nil, data
	}
	fm = rest[:end]
	body = rest[end+4:]
	body = bytes.TrimLeft(body, "\r\n")
	return fm, body
}

func parseDate(s string) (time.Time, bool) {
	if s == "" {
		return time.Time{}, false
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func humanize(s string) string {
	s = strings.ReplaceAll(s, "-", " ")
	s = strings.ReplaceAll(s, "_", " ")
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func sortArticles(a []*Article) {
	sort.SliceStable(a, func(i, j int) bool {
		if a[i].SortOrder != a[j].SortOrder && (a[i].SortOrder != 0 || a[j].SortOrder != 0) {
			if a[i].SortOrder == 0 {
				return false
			}
			if a[j].SortOrder == 0 {
				return true
			}
			return a[i].SortOrder < a[j].SortOrder
		}
		if !a[i].Date.IsZero() && !a[j].Date.IsZero() && !a[i].Date.Equal(a[j].Date) {
			return a[i].Date.After(a[j].Date)
		}
		return strings.ToLower(a[i].Title) < strings.ToLower(a[j].Title)
	})
}
