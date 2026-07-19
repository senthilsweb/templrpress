#!/usr/bin/env python3
"""CI-safe graphify build (structural / AST extraction only).

The full graphify skill requires an LLM orchestrator (claude/copilot) to dispatch
parallel semantic-extraction subagents. That cannot run in GitHub Actions.

This script does the deterministic, free, no-LLM portion:
  * detect files
  * AST extraction over code files (Part A of the skill)
  * write graphify-out/graph.json (cytoscape-style elements)
  * write graphify-out/manifest.json with provenance

The result is a structural cross-reference graph (imports, calls, defines).
That's exactly what scripts/graphify-index.py needs to produce the token-cheap
graph-index.json slice. Semantic / community / clustering enrichment can still
be done locally via `/graphify` and pushed manually if needed.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    # chdir so graphify records source_file as repo-relative paths
    # (e.g. 'internal/handlers/api.go') instead of absolute. Downstream
    # scripts/graphify-index.py groups by relative module prefix.
    os.chdir(root)
    out_dir = Path("graphify-out")
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        from graphify.detect import detect
        from graphify.extract import collect_files, extract
    except Exception as e:
        print(f"ERROR: graphify import failed: {e}", file=sys.stderr)
        return 1

    print(f"graphify-build: scanning {root}")
    detect_result = detect(Path("."))
    code_files_raw = detect_result.get("files", {}).get("code", [])
    code_paths: list[Path] = []
    for f in code_files_raw:
        p = Path(f)
        if p.is_dir():
            code_paths.extend(collect_files(p))
        elif p.is_file():
            code_paths.append(p)

    if not code_paths:
        print("graphify-build: no code files detected; writing empty graph.")
        graph = {"directed": True, "multigraph": False, "nodes": [], "links": []}
        (out_dir / "graph.json").write_text(json.dumps(graph, indent=2))
        return 0

    print(f"graphify-build: extracting AST over {len(code_paths)} code files…")
    t0 = time.time()
    ast = extract(code_paths)
    elapsed = time.time() - t0
    nodes = ast.get("nodes", [])
    edges = ast.get("edges", [])
    print(f"graphify-build: {len(nodes)} nodes, {len(edges)} edges in {elapsed:.1f}s")

    # Write NetworkX node-link graph.json — the shape TemplrGo's knowledge-graph
    # explorer parses ({directed, multigraph, nodes[], links[]}); flat nodes and
    # links, no cytoscape {data:{...}} envelopes.
    graph = {
        "directed": True,
        "multigraph": False,
        "nodes": nodes,
        "links": edges,
        "metadata": {
            "generator": "scripts/graphify-build.py (AST-only)",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source_sha": os.environ.get("GITHUB_SHA", ""),
            "source_ref": os.environ.get("GITHUB_REF", ""),
            "node_count": len(nodes),
            "edge_count": len(edges),
        },
    }
    (out_dir / "graph.json").write_text(json.dumps(graph, indent=2))
    print(f"graphify-build: wrote {out_dir / 'graph.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
