# syntax=docker/dockerfile:1.7

# ---- SPA build stage -----------------------------------------------------
FROM node:20-alpine AS spa-builder
WORKDIR /spa
COPY templrpress-nextjs/package.json templrpress-nextjs/package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY templrpress-nextjs/ ./
RUN npm run build

# ---- Go build stage ------------------------------------------------------
FROM golang:1.22-alpine AS builder
WORKDIR /src

RUN apk add --no-cache git
COPY go.mod go.sum* ./
RUN go mod download || true
COPY . .
# Pull the SPA static export into the embed location used by go:embed
RUN rm -rf templrpress-nextjs/out
COPY --from=spa-builder /spa/out ./templrpress-nextjs/out

ARG VERSION=dev
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} \
    go build -trimpath -ldflags "-s -w -X main.version=${VERSION}" \
    -o /out/templrpress .

# ---- runtime stage -------------------------------------------------------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata wget && \
    addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=builder /out/templrpress /usr/local/bin/templrpress
COPY config.example.yaml /app/config.example.yaml

USER app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:5000/healthz || exit 1

ENTRYPOINT ["templrpress"]
CMD []
