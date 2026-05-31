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
type Loader struct {
	fs       fs.FS  // active filesystem (embedded or disk)
	root     string // path inside fs (e.g. "content")
	external bool   // true when reading from disk (no caching)

	md goldmark.Markdown

	mu    sync.RWMutex
	cache map[string]*Article // key = relative path
}

// New returns a Loader. If externalDir is non-empty and exists, it is used;
// otherwise embeddedFS is used at embeddedRoot (e.g. "content").
func New(embeddedFS fs.FS, embeddedRoot, externalDir string) *Loader {
	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM, extension.Footnote, extension.Table),
		goldmark.WithParserOptions(parser.WithAutoHeadingID()),
		goldmark.WithRendererOptions(html.WithUnsafe()),
	)
	l := &Loader{md: md, cache: map[string]*Article{}}
	if externalDir != "" {
		if info, err := os.Stat(externalDir); err == nil && info.IsDir() {
			l.fs = os.DirFS(externalDir)
			l.root = "."
			l.external = true
			return l
		}
	}
	sub, err := fs.Sub(embeddedFS, embeddedRoot)
	if err != nil {
		// Fall back to raw fs; lookup will simply return errors
		l.fs = embeddedFS
		l.root = embeddedRoot
		return l
	}
	l.fs = sub
	l.root = "."
	return l
}

// IsExternal reports whether content is being read from disk (vs. embedded).
func (l *Loader) IsExternal() bool { return l.external }

// All scans the active filesystem for *.md files and returns them sorted.
// In external mode it bypasses the cache so edits show up immediately.
func (l *Loader) All() ([]*Article, error) {
	if !l.external {
		l.mu.RLock()
		if len(l.cache) > 0 {
			out := make([]*Article, 0, len(l.cache))
			for _, a := range l.cache {
				out = append(out, a)
			}
			l.mu.RUnlock()
			sortArticles(out)
			return out, nil
		}
		l.mu.RUnlock()
	}

	out, err := l.scan()
	if err != nil {
		return nil, err
	}
	if !l.external {
		l.mu.Lock()
		l.cache = map[string]*Article{}
		for _, a := range out {
			l.cache[a.Path] = a
		}
		l.mu.Unlock()
	}
	sortArticles(out)
	return out, nil
}

func (l *Loader) scan() ([]*Article, error) {
	var out []*Article
	err := fs.WalkDir(l.fs, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(p), ".md") {
			return nil
		}
		a, err := l.loadFile(p)
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
	data, err := fs.ReadFile(l.fs, p)
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
