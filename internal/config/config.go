package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config is the root configuration loaded from YAML.
type Config struct {
	Site         SiteConfig         `yaml:"site"`
	Server       ServerConfig       `yaml:"server"`
	Branding     BrandingConfig     `yaml:"branding"`
	CMS          CMSConfig          `yaml:"cms"`
	Blog         BlogConfig         `yaml:"blog"`
	APIDocs      APIDocsConfig      `yaml:"api_docs"`
	OpenAPISpecs []OpenAPISpecEntry `yaml:"openapi_specs"`
	Footer       FooterConfig       `yaml:"footer"`
	Nav          []NavItem          `yaml:"navigation"`

	// Deprecated: use `cms:` instead. Retained so existing config files
	// keep working — values are folded into CMS during applyDefaults().
	Content *LegacyContentConfig `yaml:"content,omitempty"`
}

// OpenAPISpecEntry registers an additional OpenAPI document available in
// the /rest-api-spec viewer's dropdown. URL is a /static/... path bundled
// with the binary (http(s):// is not supported in the OSS build).
type OpenAPISpecEntry struct {
	Name        string `yaml:"name"`
	URL         string `yaml:"url"`
	Description string `yaml:"description"`
	IsDefault   bool   `yaml:"is_default"`
}

type SiteConfig struct {
	Name        string `yaml:"name"`
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
	URL         string `yaml:"url"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type BrandingConfig struct {
	LogoText    string `yaml:"logo_text"`
	LogoURL     string `yaml:"logo_url"`
	LogoDarkURL string `yaml:"logo_dark_url"`
	FaviconURL  string `yaml:"favicon_url"`
	GitHubURL   string `yaml:"github_url"`
	PrimaryHex  string `yaml:"primary_hex"`

	HeroBadge     string `yaml:"hero_badge"`
	HeroHeading   string `yaml:"hero_heading"`
	HeroHighlight string `yaml:"hero_heading_highlight"`
	HeroSuffix    string `yaml:"hero_heading_suffix"`
	HeroTagline   string `yaml:"hero_tagline"`
	HeroCTAText   string `yaml:"hero_cta_primary_text"`
	HeroCTAURL    string `yaml:"hero_cta_primary_url"`
	HeroCTA2Text  string `yaml:"hero_cta_secondary_text"`
	HeroCTA2URL   string `yaml:"hero_cta_secondary_url"`

	// Landing page extras. All optional: an empty QuickstartCommand hides
	// the quickstart strip; a nil Features list keeps the SPA's built-in
	// default cards.
	QuickstartTitle   string        `yaml:"quickstart_title"`
	QuickstartCommand string        `yaml:"quickstart_command"`
	// QuickstartCommands supersedes the single title/command pair when set:
	// each entry renders its own labeled strip (e.g. Docker + bare binary).
	QuickstartCommands []QuickstartEntry `yaml:"quickstart_commands"`

	// Hero layout: "centered" (default) or "split" — left-aligned text with
	// a mac-window code card on the right (templrgo style).
	HeroLayout    string `yaml:"hero_layout"`
	HeroCodeTitle string `yaml:"hero_code_title"` // window title, e.g. docker-compose.yaml
	HeroCode      string `yaml:"hero_code"`       // card body (YAML-tinted by the SPA)
	FeaturesStyle     string        `yaml:"features_style"` // "tint" (default) | "gradient"
	Features          []FeatureCard `yaml:"features"`

	// Showcase rows rendered below the feature grid: alternating
	// text/visual bands (Ghost-style). Empty list hides the section.
	Showcase []ShowcaseItem `yaml:"showcase"`
}

// QuickstartEntry is one labeled command strip under the hero CTAs.
type QuickstartEntry struct {
	Title   string `yaml:"title"`
	Command string `yaml:"command"`
}

// ShowcaseItem is one alternating text/visual feature band on the landing
// page. ImageURL may be a /static/... path (embedded or volume-mounted) or
// an absolute URL.
type ShowcaseItem struct {
	Title    string `yaml:"title"`
	Body     string `yaml:"body"`
	ImageURL string `yaml:"image_url"`
	CTAText  string `yaml:"cta_text"`
	CTAURL   string `yaml:"cta_url"`
}

// FeatureCard is one config-driven card on the landing page feature grid.
// Icon accepts an allowlisted lucide name (book-open, code, file-text, zap,
// rocket, layers, globe, terminal); unknown names fall back to file-text.
type FeatureCard struct {
	Icon        string `yaml:"icon"`
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
	URL         string `yaml:"url"`
	// Gradient-style extras: CTAText renders an action button on the card;
	// Gradient picks a preset (violet, rose, amber, teal, navy) — cards
	// cycle through presets when unset.
	CTAText  string `yaml:"cta_text"`
	Gradient string `yaml:"gradient"`
}

// CMSConfig holds markdown content settings. Mirrors templrgo's cms: block.
//
//   - Source: optional on-disk directory merged with the embedded content
//     in UNION mode (embedded wins on path collision).
//   - Folders: per-folder overrides. When `cms.folders.<name>.source` is
//     set, that folder switches to REPLACE mode: embedded entries for the
//     folder are excluded and only the override path is scanned.
type CMSConfig struct {
	Source    string                     `yaml:"source"`
	CacheTTL  string                     `yaml:"cache_ttl"`
	Folders   map[string]CMSFolderConfig `yaml:"folders"`
	DocsRoot  string                     `yaml:"docs_root"`
	AboutFile string                     `yaml:"about_file"`
}

// CMSFolderConfig is the per-folder external override.
type CMSFolderConfig struct {
	Source   string `yaml:"source"`
	CacheTTL string `yaml:"cache_ttl"`
}

// LegacyContentConfig accepts the old `content:` block and is folded into CMS.
type LegacyContentConfig struct {
	Source    string `yaml:"source"`
	DocsRoot  string `yaml:"docs_root"`
	AboutFile string `yaml:"about_file"`
}

type BlogConfig struct {
	Enabled  bool   `yaml:"enabled"`
	Root     string `yaml:"root"` // subfolder under content (default "blog")
	PageSize int    `yaml:"page_size"`
	// Source is an on-disk directory the blog is read from. Blog content is
	// always external — if Source is empty the loader looks for `./<root>`
	// (e.g. ./blog or ./content/blog) and disables the blog if neither exists.
	Source string `yaml:"source"`
}

type APIDocsConfig struct {
	Enabled bool `yaml:"enabled"`
	// SpecURL: where the OpenAPI/Swagger JSON or YAML lives. Either a relative
	// path served from /static (e.g. /static/openapi.yaml) or an http(s):// URL.
	SpecURL string `yaml:"spec_url"`
	Title   string `yaml:"title"`
}

type FooterConfig struct {
	Enabled       bool   `yaml:"enabled"`
	CreditPrefix  string `yaml:"credit_prefix"`
	CreditText    string `yaml:"credit_text"`
	CreditURL     string `yaml:"credit_url"`
	CTATagline    string `yaml:"cta_tagline"`
	CTAPrimary    string `yaml:"cta_primary"`
	CTASecondary  string `yaml:"cta_secondary"`
	CTAButtonText string `yaml:"cta_button_text"`
	CTAButtonURL  string `yaml:"cta_button_url"`

	// Tagline shown under the brand name in the bottom-left of the footer.
	Tagline string `yaml:"tagline"`
	// Columns of links rendered above the bottom bar. Each column has a
	// `title` plus a list of `links` ({label, url, external}).
	Columns []FooterColumn `yaml:"columns"`
}

type FooterColumn struct {
	Title string       `yaml:"title" json:"title"`
	Links []FooterLink `yaml:"links" json:"links"`
}

type FooterLink struct {
	Label    string `yaml:"label" json:"label"`
	URL      string `yaml:"url" json:"url"`
	External bool   `yaml:"external" json:"external,omitempty"`
}

type NavItem struct {
	Label    string    `yaml:"label"`
	URL      string    `yaml:"url"`
	Icon     string    `yaml:"icon"`
	External bool      `yaml:"external"`
	Enabled  *bool     `yaml:"enabled"` // nil = true
	Children []NavItem `yaml:"children"`

	// Flyout extras (templrgo-style). Subtitle/Description/ImageURL enrich a
	// child row; Columns switches the flyout to a multi-column layout;
	// Footer adds the full-bleed themed band below the flyout body.
	Title       string      `yaml:"title"`
	Subtitle    string      `yaml:"subtitle"`
	Description string      `yaml:"description"`
	ImageURL    string      `yaml:"image_url"`
	Columns     []NavColumn `yaml:"columns"`
	Footer      *NavFooter  `yaml:"footer"`
}

// NavColumn is one titled column inside a multi-column flyout.
type NavColumn struct {
	Title    string    `yaml:"title"`
	Children []NavItem `yaml:"children"`
}

// NavFooter is the optional full-bleed band at the bottom of a flyout,
// themed with the active primary color.
type NavFooter struct {
	Title    string `yaml:"title"`
	Subtitle string `yaml:"subtitle"`
	URL      string `yaml:"url"`
}

func (n NavItem) IsEnabled() bool {
	if n.Enabled == nil {
		return true
	}
	return *n.Enabled
}

// Load reads config from path; if empty, tries ./config.yaml then built-in default.
func Load(path string, fallback []byte) (*Config, string, error) {
	var (
		data   []byte
		source string
		err    error
	)

	if path != "" {
		data, err = os.ReadFile(path)
		if err != nil {
			return nil, "", err
		}
		source = path
	} else if _, statErr := os.Stat("config.yaml"); statErr == nil {
		data, err = os.ReadFile("config.yaml")
		if err != nil {
			return nil, "", err
		}
		source = "config.yaml"
	} else {
		data = fallback
		source = "built-in defaults"
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, "", fmt.Errorf("yaml unmarshal: %w", err)
	}

	cfg.applyDefaults()
	return &cfg, source, nil
}

func (c *Config) applyDefaults() {
	if c.Site.Name == "" {
		c.Site.Name = "TemplrPress"
	}
	if c.Site.Title == "" {
		c.Site.Title = c.Site.Name
	}
	if c.Server.Host == "" {
		c.Server.Host = "0.0.0.0"
	}
	if c.Server.Port == 0 {
		c.Server.Port = 5000
	}
	if c.Branding.LogoText == "" {
		c.Branding.LogoText = "TemplrPress"
	}
	if c.Branding.PrimaryHex == "" {
		c.Branding.PrimaryHex = "#1e40af"
	}
	if c.CMS.DocsRoot == "" {
		c.CMS.DocsRoot = "docs"
	}
	if c.CMS.AboutFile == "" {
		c.CMS.AboutFile = "about.md"
	}
	if c.CMS.CacheTTL == "" {
		c.CMS.CacheTTL = "30m"
	}
	// Legacy `content:` block → fold into cms when cms fields are unset.
	if c.Content != nil {
		if c.CMS.Source == "" {
			c.CMS.Source = c.Content.Source
		}
		if c.Content.DocsRoot != "" {
			c.CMS.DocsRoot = c.Content.DocsRoot
		}
		if c.Content.AboutFile != "" {
			c.CMS.AboutFile = c.Content.AboutFile
		}
	}
	if c.Blog.Root == "" {
		c.Blog.Root = "blog"
	}
	if c.Blog.PageSize == 0 {
		c.Blog.PageSize = 10
	}
	if c.APIDocs.Title == "" {
		c.APIDocs.Title = "API Reference"
	}
}
