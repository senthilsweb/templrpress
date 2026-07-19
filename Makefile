APP_NAME := templrpress
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%dT%H:%M:%SZ')
BUILD_USER := $(shell whoami)

LDFLAGS := -s -w \
           -X main.version=$(VERSION) \
           -X main.GitCommit=$(GIT_COMMIT) \
           -X main.GitBranch=$(GIT_BRANCH) \
           -X main.BuildTime=$(BUILD_TIME) \
           -X main.BuildUser=$(BUILD_USER)

.PHONY: all build dev clean nextjs-build nextjs-install build-nextjs kill-port run tidy llms docker docker-run build-all help

# `make` with no target prints help.
.DEFAULT_GOAL := help

# Default config file; override at the command line: `make run CONFIG=path/to/config.yaml`
CONFIG ?= config.example.yaml

# Space- or tab-separated list of ports; e.g. `make kill-port PORTS="3000 5000 8080"`
PORTS ?=

help: ## Show this help (also: `make` with no target).
	@echo ""
	@echo "TemplrPress — Makefile help"
	@echo "---------------------------"
	@echo "Note: GNU make's own '-h' flag prints make's options. Use 'make help' for project targets."
	@echo ""
	@echo "Frequently used:"
	@echo "  make build-nextjs                       Build the embedded Next.js SPA (static export)."
	@echo "  make run                                Run the Go server with config.example.yaml."
	@echo "  make run CONFIG=config.yaml             Run the Go server with a custom config file."
	@echo "  make kill-port PORTS=5000               Kill the process listening on port 5000."
	@echo "  make kill-port PORTS=\"3000 5000 8080\"   Kill listeners on multiple ports (space- or tab-separated)."
	@echo ""
	@echo "Build:"
	@echo "  make build                              Build a single binary for the current OS/arch into bin/."
	@echo "  make build-all                          Cross-compile darwin-arm64, darwin-amd64, linux-amd64."
	@echo "  make all                                tidy + nextjs-build + build."
	@echo "  make clean                              Remove built binaries and Next.js artifacts."
	@echo ""
	@echo "Frontend:"
	@echo "  make nextjs-install                     Install Next.js npm dependencies."
	@echo "  make nextjs-build                       Build Next.js static export (alias: make build-nextjs)."
	@echo ""
	@echo "Docker:"
	@echo "  make docker                             Build the Docker image (templrpress:VERSION + :latest)."
	@echo "  make docker-run                         Run the Docker image on port 5000."
	@echo ""
	@echo "Variables:"
	@echo "  CONFIG  Path to the YAML config file (default: config.example.yaml)."
	@echo "  PORTS   Space- or tab-separated list of TCP ports for 'make kill-port'."
	@echo ""

all: tidy nextjs-build build

tidy:
	go mod tidy

llms:
	@echo "Regenerating llms.txt..."
	go run . llms -o llms.txt

build:
	@echo "Building $(APP_NAME) $(VERSION)..."
	CGO_ENABLED=0 go build -trimpath -ldflags "$(LDFLAGS)" -o bin/$(APP_NAME) .

dev: nextjs-build
	@echo "Running in dev mode..."
	go run . -f $(CONFIG)

clean:
	rm -rf bin/$(APP_NAME)* templrpress-nextjs/out templrpress-nextjs/.next

nextjs-install:
	cd templrpress-nextjs && npm install

nextjs-build:
	cd templrpress-nextjs && npm run build

# Alias matching the verb-first naming the docs use.
build-nextjs: nextjs-build

# Run the Go server against $(CONFIG). Defaults to config.example.yaml.
# Examples:
#   make run
#   make run CONFIG=config.yaml
#   make run CONFIG=/tmp/custom.yaml
run:
	@echo "Running $(APP_NAME) with config: $(CONFIG)"
	go run . -f $(CONFIG)

# Kill any process listening on one or more TCP ports.
# Examples:
#   make kill-port PORTS=5000
#   make kill-port PORTS="3000 5000"
#   make kill-port PORTS="3000	5000	8080"   # tab-separated also works
kill-port:
	@if [ -z "$(strip $(PORTS))" ]; then \
		echo "Usage: make kill-port PORTS=\"3000 5000\""; \
		echo "       (space- or tab-separated list of TCP ports)"; \
		exit 2; \
	fi
	@for p in $(PORTS); do \
		pids=$$(lsof -ti tcp:$$p 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			echo "Killing port $$p (pids: $$pids)"; \
			kill -9 $$pids 2>/dev/null || true; \
		else \
			echo "Port $$p: no listener"; \
		fi; \
	done

build-all: nextjs-build
	@echo "Building for all platforms..."
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "$(LDFLAGS)" -o bin/$(APP_NAME)-darwin-arm64 .
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags "$(LDFLAGS)" -o bin/$(APP_NAME)-darwin-amd64 .
	CGO_ENABLED=0 GOOS=linux  GOARCH=amd64 go build -trimpath -ldflags "$(LDFLAGS)" -o bin/$(APP_NAME)-linux-amd64 .
	@echo "Build complete."

docker:
	docker build --build-arg VERSION=$(VERSION) -t $(APP_NAME):$(VERSION) -t $(APP_NAME):latest .

docker-run:
	docker run --rm -p 5000:5000 $(APP_NAME):latest
