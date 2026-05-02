#!/usr/bin/env python3
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

FEEDS = [
    "https://news.google.com/rss/search?q=AI&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en",
    "https://www.reddit.com/r/artificial/.rss",
]

MAX_ITEMS = 40


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


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


def main():
    all_items = []
    for feed in FEEDS:
        try:
            all_items.extend(parse_feed(feed))
        except Exception as exc:
            print(f"[warn] failed to parse {feed}: {exc}")

    dedup = {}
    for i in all_items:
        key = i["link"]
        if key not in dedup:
            dedup[key] = i

    items = list(dedup.values())[:MAX_ITEMS]

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }

    with open("site/news.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"wrote site/news.json with {len(items)} items")


if __name__ == "__main__":
    main()
