#!/usr/bin/env python3
"""Scaled-content duplication audit for built pSEO comparison pages.

Compares Jaccard similarity of unique-word vocabularies between child
modifier routes that share the same master hub (e.g. /deel-vs-remote-for-agencies/
vs /deel-vs-remote-for-us-latam/). Pairs above 75% overlap are flagged as
Google scaled-content spam risk.
"""

from __future__ import annotations

import html as html_lib
import re
import sys
from collections import defaultdict
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
THRESHOLD = 0.75

SCRIPT_STYLE_RE = re.compile(
    r"<(script|style|noscript)\b[^>]*>.*?</\1>",
    re.IGNORECASE | re.DOTALL,
)
MAIN_RE = re.compile(r"<main\b[^>]*>(.*?)</main>", re.IGNORECASE | re.DOTALL)
BODY_RE = re.compile(r"<body\b[^>]*>(.*?)</body>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")
TOKEN_RE = re.compile(r"[a-z0-9]+")


def page_slug(html_path: Path) -> str:
    rel = html_path.relative_to(DIST)
    if rel.name == "index.html":
        return rel.parent.as_posix().strip("/")
    return rel.with_suffix("").as_posix().strip("/")


def hub_and_modifier(slug: str) -> tuple[str, str] | None:
    """Split brand-a-vs-brand-b-for-modifier. First -for- after -vs- is the boundary."""
    if "-for-" not in slug or "-vs-" not in slug:
        return None
    vs_index = slug.find("-vs-")
    after_vs = slug[vs_index + 4 :]
    for_index = after_vs.find("-for-")
    if for_index == -1:
        return None
    hub = f"{slug[:vs_index]}-vs-{after_vs[:for_index]}"
    modifier = after_vs[for_index + 5 :]
    if not hub or not modifier:
        return None
    return hub, modifier


def isolate_body_copy(markup: str) -> str:
    stripped = SCRIPT_STYLE_RE.sub(" ", markup)
    match = MAIN_RE.search(stripped) or BODY_RE.search(stripped)
    chunk = match.group(1) if match else stripped
    text = TAG_RE.sub(" ", chunk)
    return html_lib.unescape(text)


def vocabulary(text: str) -> set[str]:
    return set(TOKEN_RE.findall(text.lower()))


def jaccard(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 1.0
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def collect_child_pages() -> dict[str, list[tuple[str, set[str]]]]:
    if not DIST.is_dir():
        raise SystemExit(
            f"No dist/ directory at {DIST}. Run `npx astro build` before auditing."
        )

    by_hub: dict[str, list[tuple[str, set[str]]]] = defaultdict(list)
    for html_path in DIST.rglob("*.html"):
        slug = page_slug(html_path)
        parsed = hub_and_modifier(slug)
        if parsed is None:
            continue
        hub, _modifier = parsed
        vocab = vocabulary(isolate_body_copy(html_path.read_text(encoding="utf-8")))
        by_hub[hub].append((f"/{slug}/", vocab))
    return by_hub


def audit() -> int:
    by_hub = collect_child_pages()
    page_count = sum(len(pages) for pages in by_hub.values())
    comparable_hubs = {hub: pages for hub, pages in by_hub.items() if len(pages) >= 2}

    flags: list[tuple[str, str, str, float]] = []
    pair_count = 0
    for hub, pages in sorted(comparable_hubs.items()):
        pages_sorted = sorted(pages, key=lambda item: item[0])
        for (url_a, vocab_a), (url_b, vocab_b) in combinations(pages_sorted, 2):
            pair_count += 1
            score = jaccard(vocab_a, vocab_b)
            if score > THRESHOLD:
                flags.append((hub, url_a, url_b, score))

    flags.sort(key=lambda row: row[3], reverse=True)

    print("pSEO scaled-content audit")
    print(f"Child modifier pages: {page_count}")
    print(f"Hubs with 2+ variants: {len(comparable_hubs)}")
    print(f"Pairs compared: {pair_count}")
    print(f"Jaccard threshold: {THRESHOLD:.0%}")
    print()

    if not flags:
        print("✅ PASSED")
        print(
            "All child-modifier variants under the same hub have distinct "
            "content signatures (Jaccard ≤ 75%)."
        )
        return 0

    print("⚠️  FAILED — scaled content overlap")
    print(f"{len(flags)} URL pair(s) exceed {THRESHOLD:.0%} vocabulary overlap.\n")
    current_hub = None
    for hub, url_a, url_b, score in flags:
        if hub != current_hub:
            print(f"Hub: /{hub}/")
            current_hub = hub
        print(f"  {url_a}  ↔  {url_b}  {score:.1%}")
    return 1


if __name__ == "__main__":
    sys.exit(audit())
