.PHONY: build run dev clean docker docker-run tidy

VERSION ?= 0.1.0
BIN     := templrpress

build:
	CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -X main.version=$(VERSION)" -o $(BIN) .

run: build
	./$(BIN) serve -f config.example.yaml

dev:
	go run . serve -f config.example.yaml

tidy:
	go mod tidy

clean:
	rm -f $(BIN)

docker:
	docker build --build-arg VERSION=$(VERSION) -t templrpress:$(VERSION) -t templrpress:latest .

docker-run:
	docker run --rm -p 5000:5000 templrpress:latest
