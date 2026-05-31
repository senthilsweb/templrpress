package banner

import (
	"fmt"
	"strings"

	"templrpress/internal/config"
)

// ANSI colour helpers (no external deps).
const (
	ansiReset    = "\033[0m"
	ansiBold     = "\033[1m"
	ansiDim      = "\033[90m"
	ansiCyanBold = "\033[1;36m"
	ansiGreen    = "\033[32m"
)

const asciiLogo = `
 _____                   _      ____                    
|_   _|__ _ __ ___  _ __ | |_ __|  _ \ _ __ ___  ___ ___ 
  | |/ _ \ '_ ' _ \| '_ \| | '__| |_) | '__/ _ \/ __/ __|
  | |  __/ | | | | | |_) | | |  |  __/| | |  __/\__ \__ \
  |_|\___|_| |_| |_| .__/|_|_|  |_|   |_|  \___||___/___/
                   |_|                                    `

// Print displays the startup banner.
func Print(cfg *config.Config, versionStr, configSource string) {
	fmt.Println(ansiCyanBold + asciiLogo + ansiReset)

	fmt.Printf("  %sTemplrPress %s%s%s — Lightweight Markdown Publishing%s\n\n",
		ansiBold, versionStr, ansiReset, ansiDim, ansiReset)

	fmt.Println("  ┌─────────────────────────────────────────────────────┐")

	host := cfg.Server.Host
	if host == "" || host == "0.0.0.0" {
		host = "localhost"
	}
	serverURL := fmt.Sprintf("http://%s:%d", host, cfg.Server.Port)
	printRow("Server", serverURL, ansiGreen)
	printRow("Config", configSource, ansiDim)

	site := cfg.Site.Name
	if site == "" {
		site = cfg.Branding.LogoText
	}
	if site != "" {
		printRow("Site", site, ansiDim)
	}

	flags := collectFeatureFlags(cfg)
	if len(flags) > 0 {
		fmt.Println("  ├─────────────────────────────────────────────────────┤")
		content := "Features: " + strings.Join(flags, " · ")
		fmt.Printf("  │  %s%s%s", ansiBold, content, ansiReset)
		pad := 51 - len(content)
		if pad > 0 {
			fmt.Print(strings.Repeat(" ", pad))
		}
		fmt.Println(" │")
	}

	fmt.Println("  ├─────────────────────────────────────────────────────┤")
	printRow("Docs", serverURL+"/docs", ansiGreen)
	printRow("API", serverURL+"/rest-api-spec", ansiDim)
	fmt.Println("  └─────────────────────────────────────────────────────┘")
	fmt.Println()
}

func printRow(label, value, colour string) {
	fmt.Printf("  │  %-10s → %s%-40s%s│\n", label, colour, value, ansiReset)
}

func collectFeatureFlags(cfg *config.Config) []string {
	var parts []string
	if cfg.Blog.Enabled {
		parts = append(parts, "Blog")
	}
	if cfg.APIDocs.Enabled {
		parts = append(parts, "API Docs")
	}
	if n := len(cfg.OpenAPISpecs); n > 0 {
		parts = append(parts, fmt.Sprintf("OpenAPI specs %d", n))
	}
	return parts
}
