package cmd

import (
	"embed"
	"flag"
	"fmt"
	"os"

	"templrpress/internal/banner"
	"templrpress/internal/config"
	"templrpress/internal/server"
)

var (
	SPAFS         embed.FS
	StaticFS      embed.FS
	ContentFS     embed.FS
	ConfigExample []byte
	Version       string
)

func Execute() error {
	if len(os.Args) < 2 {
		return runServe(nil)
	}

	switch os.Args[1] {
	case "serve", "":
		return runServe(os.Args[2:])
	case "version", "-v", "--version":
		fmt.Printf("templrpress %s\n", Version)
		return nil
	case "init":
		return runInit(os.Args[2:])
	case "help", "-h", "--help":
		printHelp()
		return nil
	default:
		// treat as flags for serve
		return runServe(os.Args[1:])
	}
}

func printHelp() {
	fmt.Printf(`templrpress %s — lightweight markdown site server

USAGE:
  templrpress [serve] [flags]      Start the HTTP server (default)
  templrpress init [-o config.yaml] Write a starter config file to disk
  templrpress version              Print version
  templrpress help                 Show this help

SERVE FLAGS:
  -f, --config <path>   Path to config file (default: ./config.yaml, then built-in)
  -p, --port <int>      Override server port
  -H, --host <ip>       Override server host

ENVIRONMENT:
  TEMPLRPRESS_CONFIG    Path to config file
  TEMPLRPRESS_PORT      Port to listen on
  TEMPLRPRESS_HOST      Host/IP to bind

`, Version)
}

func runServe(args []string) error {
	fs := flag.NewFlagSet("serve", flag.ContinueOnError)
	var (
		configPath string
		port       int
		host       string
	)
	fs.StringVar(&configPath, "config", "", "Path to config file")
	fs.StringVar(&configPath, "f", "", "Path to config file (shorthand)")
	fs.IntVar(&port, "port", 0, "Server port")
	fs.IntVar(&port, "p", 0, "Server port (shorthand)")
	fs.StringVar(&host, "host", "", "Server host")
	fs.StringVar(&host, "H", "", "Server host (shorthand)")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if configPath == "" {
		configPath = os.Getenv("TEMPLRPRESS_CONFIG")
	}

	cfg, source, err := config.Load(configPath, ConfigExample)
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	if port > 0 {
		cfg.Server.Port = port
	}
	if host != "" {
		cfg.Server.Host = host
	}
	if envPort := os.Getenv("TEMPLRPRESS_PORT"); envPort != "" && port == 0 {
		fmt.Fprintf(os.Stderr, "TEMPLRPRESS_PORT=%s\n", envPort)
	}
	if envHost := os.Getenv("TEMPLRPRESS_HOST"); envHost != "" && host == "" {
		cfg.Server.Host = envHost
	}

	srv, err := server.New(cfg, server.Assets{
		SPA:     SPAFS,
		Static:  StaticFS,
		Content: ContentFS,
		Version: Version,
	})
	if err != nil {
		return err
	}

	banner.Print(cfg, Version, source)
	return srv.Run()
}

func runInit(args []string) error {
	fs := flag.NewFlagSet("init", flag.ContinueOnError)
	out := fs.String("o", "config.yaml", "output path")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if _, err := os.Stat(*out); err == nil {
		return fmt.Errorf("%s already exists", *out)
	}
	if err := os.WriteFile(*out, ConfigExample, 0o644); err != nil {
		return err
	}
	fmt.Printf("wrote %s\n", *out)
	return nil
}
