#!/usr/bin/env python3
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

CONFIG_PATH = Path("site/news_config.json")
OUTPUT_PATH = Path("site/news.json")

DEFAULT_CONFIG = {
    "maxItems": 40,
    "feeds": [
        "https://news.google.com/rss/search?q=AI&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
        "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en",
    ],
    "blacklistKeywords": [],
    "pinnedLinks": [],
}


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return DEFAULT_CONFIG.copy()

    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    cfg = DEFAULT_CONFIG.copy()
    cfg.update(data)
    cfg["feeds"] = [x.strip() for x in cfg.get("feeds", []) if isinstance(x, str) and x.strip()]
    cfg["blacklistKeywords"] = [
        x.strip().lower() for x in cfg.get("blacklistKeywords", []) if isinstance(x, str) and x.strip()
    ]
    cfg["pinnedLinks"] = [x.strip() for x in cfg.get("pinnedLinks", []) if isinstance(x, str) and x.strip()]
    cfg["maxItems"] = max(1, int(cfg.get("maxItems", 40)))
    return cfg


def parse_feed(url: str):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AI-News-Bot/1.0)",
            "Accept": "application/rss+xml, application/xml, text/xml",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()

    root = ET.fromstring(raw)
    items = []

    for item in root.findall(".//item"):
        title = strip_html(item.findtext("title", default=""))
        link = strip_html(item.findtext("link", default=""))
        pub_date = strip_html(item.findtext("pubDate", default=""))
        source = ""

        src_node = item.find("source")
        if src_node is not None and src_node.text:
            source = strip_html(src_node.text)

        if not source:
            source = urllib.parse.urlparse(link).netloc.replace("www.", "")

        if title and link:
            items.append(
                {
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "source": source,
                }
            )

    return items


def is_blacklisted(item: dict, blacklist: list[str]) -> bool:
    text = f"{item.get('title', '')} {item.get('source', '')}".lower()
    return any(k in text for k in blacklist)


def reorder_pinned(items: list[dict], pinned_links: list[str]) -> list[dict]:
    if not pinned_links:
        return items

    by_link = {i["link"]: i for i in items}
    pinned = [by_link[link] for link in pinned_links if link in by_link]
    pinned_set = {i["link"] for i in pinned}
    rest = [i for i in items if i["link"] not in pinned_set]
    return pinned + rest


def main():
    cfg = load_config()
    all_items = []

    for feed in cfg["feeds"]:
        try:
            all_items.extend(parse_feed(feed))
        except Exception as exc:
            print(f"[warn] failed to parse {feed}: {exc}")

    dedup = {}
    for i in all_items:
        key = i["link"]
        if key not in dedup:
            dedup[key] = i

    items = [i for i in dedup.values() if not is_blacklisted(i, cfg["blacklistKeywords"])]
    items = reorder_pinned(items, cfg["pinnedLinks"])
    items = items[: cfg["maxItems"]]

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "meta": {
            "feedCount": len(cfg["feeds"]),
            "blacklistCount": len(cfg["blacklistKeywords"]),
            "pinnedCount": len(cfg["pinnedLinks"]),
        },
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"wrote {OUTPUT_PATH} with {len(items)} items")


if __name__ == "__main__":
    main()
