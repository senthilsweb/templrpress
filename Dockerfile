# syntax=docker/dockerfile:1.7
# ---- build stage ---------------------------------------------------------
FROM golang:1.22-alpine AS builder
WORKDIR /src

RUN apk add --no-cache git
COPY go.mod go.sum* ./
RUN go mod download || true
COPY . .

ARG VERSION=dev
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} \
    go build -trimpath -ldflags "-s -w -X main.version=${VERSION}" \
    -o /out/templrpress .

# ---- runtime stage -------------------------------------------------------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=builder /out/templrpress /usr/local/bin/templrpress
COPY config.example.yaml /app/config.example.yaml

USER app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:5000/healthz || exit 1

ENTRYPOINT ["templrpress"]
CMD ["serve"]
