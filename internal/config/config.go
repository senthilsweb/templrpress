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
	Content      ContentConfig      `yaml:"content"`
	Blog         BlogConfig         `yaml:"blog"`
	APIDocs      APIDocsConfig      `yaml:"api_docs"`
	OpenAPISpecs []OpenAPISpecEntry `yaml:"openapi_specs"`
	Footer       FooterConfig       `yaml:"footer"`
	Nav          []NavItem          `yaml:"navigation"`
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
}

type ContentConfig struct {
	// Source: directory on disk to read markdown from. Empty = use embedded.
	Source string `yaml:"source"`
	// DocsRoot is the subfolder under content for docs (default "docs").
	DocsRoot string `yaml:"docs_root"`
	// AboutFile is the path to the about page markdown (default "about.md").
	AboutFile string `yaml:"about_file"`
}

type BlogConfig struct {
	Enabled  bool   `yaml:"enabled"`
	Root     string `yaml:"root"` // subfolder under content (default "blog")
	PageSize int    `yaml:"page_size"`
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
	Title string       `yaml:"title"`
	Links []FooterLink `yaml:"links"`
}

type FooterLink struct {
	Label    string `yaml:"label"`
	URL      string `yaml:"url"`
	External bool   `yaml:"external"`
}

type NavItem struct {
	Label    string    `yaml:"label"`
	URL      string    `yaml:"url"`
	Icon     string    `yaml:"icon"`
	External bool      `yaml:"external"`
	Enabled  *bool     `yaml:"enabled"` // nil = true
	Children []NavItem `yaml:"children"`
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
	if c.Content.DocsRoot == "" {
		c.Content.DocsRoot = "docs"
	}
	if c.Content.AboutFile == "" {
		c.Content.AboutFile = "about.md"
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
