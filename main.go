package main

import (
	"embed"
	"fmt"
	"os"

	"templrpress/cmd"
)

//go:embed all:templates
var templatesFS embed.FS

//go:embed all:static
var staticFS embed.FS

//go:embed all:content
var contentFS embed.FS

//go:embed config.example.yaml
var configExample []byte

var version = "0.1.0"

func main() {
	cmd.TemplatesFS = templatesFS
	cmd.StaticFS = staticFS
	cmd.ContentFS = contentFS
	cmd.ConfigExample = configExample
	cmd.Version = version

	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
