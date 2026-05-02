#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

CONFIG_PATH = Path("site/news_config.json")


def load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg):
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
        f.write("\n")


def unique_keep_order(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            out.append(x)
            seen.add(x)
    return out


def main():
    parser = argparse.ArgumentParser(description="Manage news config")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("show")

    add_feed = sub.add_parser("add-feed")
    add_feed.add_argument("url")

    rm_feed = sub.add_parser("remove-feed")
    rm_feed.add_argument("url")

    add_kw = sub.add_parser("add-blacklist")
    add_kw.add_argument("keyword")

    rm_kw = sub.add_parser("remove-blacklist")
    rm_kw.add_argument("keyword")

    pin = sub.add_parser("pin")
    pin.add_argument("link")

    unpin = sub.add_parser("unpin")
    unpin.add_argument("link")

    max_items = sub.add_parser("set-max")
    max_items.add_argument("count", type=int)

    args = parser.parse_args()
    cfg = load_config()

    if args.cmd == "show":
        print(json.dumps(cfg, ensure_ascii=False, indent=2))
        return

    if args.cmd == "add-feed":
        cfg.setdefault("feeds", []).append(args.url.strip())
        cfg["feeds"] = unique_keep_order([x for x in cfg["feeds"] if x.strip()])
    elif args.cmd == "remove-feed":
        cfg["feeds"] = [x for x in cfg.get("feeds", []) if x != args.url.strip()]
    elif args.cmd == "add-blacklist":
        cfg.setdefault("blacklistKeywords", []).append(args.keyword.strip().lower())
        cfg["blacklistKeywords"] = unique_keep_order([x for x in cfg["blacklistKeywords"] if x.strip()])
    elif args.cmd == "remove-blacklist":
        key = args.keyword.strip().lower()
        cfg["blacklistKeywords"] = [x for x in cfg.get("blacklistKeywords", []) if x != key]
    elif args.cmd == "pin":
        cfg.setdefault("pinnedLinks", []).append(args.link.strip())
        cfg["pinnedLinks"] = unique_keep_order([x for x in cfg["pinnedLinks"] if x.strip()])
    elif args.cmd == "unpin":
        cfg["pinnedLinks"] = [x for x in cfg.get("pinnedLinks", []) if x != args.link.strip()]
    elif args.cmd == "set-max":
        cfg["maxItems"] = max(1, args.count)

    save_config(cfg)
    print("updated", CONFIG_PATH)


if __name__ == "__main__":
    main()
