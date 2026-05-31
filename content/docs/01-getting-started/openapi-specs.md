---
title: OpenAPI specs
slug: openapi-specs
description: Register one or more OpenAPI specs and view them at /rest-api-spec.
category: Getting Started
sort_order: 35
published: true
---

# OpenAPI specs

TemplrPress ships a Swagger-style viewer at `/rest-api-spec` that can render
**multiple** OpenAPI documents. The selector dropdown lists each registered
spec; the built-in entry (labeled `templrpress`) describes the binary's own
HTTP API.

## Drop-in: a single spec

If you only have one OpenAPI document, set:

```yaml
api_docs:
  title:    "My API"
  spec_url: "/static/openapi.yaml"   # JSON or YAML — both are accepted
```

Place the file at `static/openapi.yaml` (or `.json`). The server auto-detects
the format and re-emits YAML as JSON for the SPA's fetch.

## Multiple specs

Register additional specs via the `openapi_specs` list. Each entry shows up in
the dropdown:

```yaml
openapi_specs:
  - name: petstore
    url: /static/openapi/petstore.json
    description: "Demo · Swagger Petstore"
    is_default: false
  - name: payments
    url: /static/openapi/payments.yaml
    description: "Internal · Payments service"
```

| Field         | Required | Notes                                         |
|---------------|----------|-----------------------------------------------|
| `name`        | yes      | URL-safe identifier shown in the dropdown.     |
| `url`         | yes      | Absolute path served by the binary.            |
| `description` | no       | Short label shown beneath the name.            |
| `is_default`  | no       | `true` opens this spec on first load.          |

The built-in `templrpress` spec is always present and cannot be removed.

## Hosting your spec files

Drop spec files into `static/openapi/` and reference them with
`/static/openapi/<name>`. They are embedded into the binary alongside the rest
of `static/`. No separate web server is needed.
