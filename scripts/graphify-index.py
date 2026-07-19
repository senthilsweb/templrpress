#!/usr/bin/env python3
"""
graphify-index.py — produce a token-cheap (≤50 KB) summary of a graphify knowledge graph.

Reads the full ``graph.json`` (cytoscape-style) emitted by graphifyy and writes
``graph-index.json`` containing per-module cross-references suitable for fast
LLM orientation.

Usage:
    python scripts/graphify-index.py <input-graph.json> <output-index.json>

Behaviour:
- Groups nodes by their module path (top-level dir under internal/, cmd/,
  templrpress-nextjs/src/, content/, scripts/, openspec/).
- For each module records: entry files, top exported labels, top outbound edges
  (calls), top inbound edges (called_by).
- If output exceeds 50 KB, drops modules with the lowest edge degree until under
  the limit and logs a warning.
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

MAX_BYTES = 50 * 1024  # 50 KB
TOP_EDGES_PER_MODULE = 8
TOP_LABELS_PER_MODULE = 6
MODULE_ROOTS = (
    "internal/",
    "cmd/",
    "templrpress-nextjs/src/",
    "content/",
    "scripts/",
    "openspec/",
)


def module_for(path: str) -> str | None:
    """Return the module key for a given file path, or None if unrecognised."""
    if not path:
        return None
    p = path.lstrip("./")
    for root in MODULE_ROOTS:
        if p.startswith(root):
            tail = p[len(root):].split("/", 1)[0]
            return f"{root.rstrip('/')}/{tail}" if tail else root.rstrip("/")
    return None


def build_index(graph: dict) -> dict:
    nodes = graph.get("nodes") or graph.get("elements", {}).get("nodes") or []
    edges = (
        graph.get("edges")
        or graph.get("links")
        or graph.get("elements", {}).get("edges")
        or []
    )

    # Normalise cytoscape `{data: {...}}` envelopes.
    def _data(item):
        return item.get("data", item) if isinstance(item, dict) else {}

    nodes_by_id = {}
    for n in nodes:
        d = _data(n)
        nid = d.get("id")
        if nid is not None:
            nodes_by_id[str(nid)] = d

    modules: dict[str, dict] = defaultdict(
        lambda: {
            "entry_files": set(),
            "labels": Counter(),
            "calls": Counter(),
            "called_by": Counter(),
        }
    )

    for nid, d in nodes_by_id.items():
        path = d.get("source_file") or d.get("file") or d.get("path") or d.get("source") or ""
        mod = module_for(path)
        if not mod:
            continue
        modules[mod]["entry_files"].add(Path(path).name)
        label = d.get("label") or d.get("name") or d.get("id")
        if label:
            modules[mod]["labels"][str(label)] += 1

    for e in edges:
        d = _data(e)
        src = nodes_by_id.get(str(d.get("source")))
        tgt = nodes_by_id.get(str(d.get("target")))
        if not src or not tgt:
            continue
        src_mod = module_for(src.get("source_file") or src.get("file") or src.get("path") or "")
        tgt_mod = module_for(tgt.get("source_file") or tgt.get("file") or tgt.get("path") or "")
        if not src_mod or not tgt_mod or src_mod == tgt_mod:
            continue
        modules[src_mod]["calls"][tgt_mod] += 1
        modules[tgt_mod]["called_by"][src_mod] += 1

    out_modules: dict[str, dict] = {}
    for mod, agg in modules.items():
        out_modules[mod] = {
            "entry_files": sorted(agg["entry_files"])[:TOP_LABELS_PER_MODULE],
            "labels": [lbl for lbl, _ in agg["labels"].most_common(TOP_LABELS_PER_MODULE)],
            "calls": [m for m, _ in agg["calls"].most_common(TOP_EDGES_PER_MODULE)],
            "called_by": [m for m, _ in agg["called_by"].most_common(TOP_EDGES_PER_MODULE)],
            "_degree": sum(agg["calls"].values()) + sum(agg["called_by"].values()),
        }

    # Sort by degree (most connected first) for trimming.
    sorted_mods = sorted(out_modules.items(), key=lambda kv: -kv[1]["_degree"])

    def serialise(mods):
        return {
            "version": 1,
            "node_count": len(nodes_by_id),
            "edge_count": len(edges),
            "module_count": len(mods),
            "modules": {
                k: {kk: vv for kk, vv in v.items() if not kk.startswith("_")}
                for k, v in mods
            },
        }

    payload = serialise(sorted_mods)
    encoded = json.dumps(payload, indent=2)
    while len(encoded.encode("utf-8")) > MAX_BYTES and sorted_mods:
        sorted_mods.pop()  # drop lowest-degree module
        payload = serialise(sorted_mods)
        encoded = json.dumps(payload, indent=2)

    if len(encoded.encode("utf-8")) > MAX_BYTES:
        print(
            f"WARNING: graph-index.json still exceeds {MAX_BYTES} bytes after trimming.",
            file=sys.stderr,
        )

    return payload


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: graphify-index.py <input-graph.json> <output-index.json>", file=sys.stderr)
        return 2

    src = Path(argv[1])
    dst = Path(argv[2])
    if not src.is_file():
        print(f"Input not found: {src}", file=sys.stderr)
        return 1

    graph = json.loads(src.read_text())
    index = build_index(graph)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(index, indent=2))
    size_kb = dst.stat().st_size / 1024
    print(f"Wrote {dst} ({size_kb:.1f} KB, {index['module_count']} modules)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
