.PHONY: build run dev clean docker docker-run tidy nextjs-install nextjs-build all kill-port

VERSION ?= 0.2.0
BIN     := templrpress
SPA_DIR := templrpress-nextjs

# Default ports to free before dev runs
PORTS ?= 5000 9898 9899

all: tidy nextjs-build build

nextjs-install:
	cd $(SPA_DIR) && npm ci

nextjs-build:
	cd $(SPA_DIR) && npm install --no-audit --no-fund && npm run build

build:
	CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -X main.version=$(VERSION)" -o $(BIN) .

run: build
	./$(BIN) -f config.example.yaml

dev:
	go run . -f config.example.yaml

tidy:
	go mod tidy

clean:
	rm -f $(BIN)
	rm -rf $(SPA_DIR)/.next $(SPA_DIR)/out

kill-port:
	@for p in $(PORTS); do \
		pids=$$(lsof -ti tcp:$$p 2>/dev/null); \
		if [ -n "$$pids" ]; then echo "kill $$p: $$pids"; kill -9 $$pids 2>/dev/null || true; fi; \
	done

docker:
	docker build --build-arg VERSION=$(VERSION) -t templrpress:$(VERSION) -t templrpress:latest .

docker-run:
	docker run --rm -p 5000:5000 templrpress:latest
