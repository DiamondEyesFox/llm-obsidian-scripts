#!/usr/bin/env python3
"""
ChatGPT to Obsidian Import Script
Imports only new conversations not already in vault
"""

import json
from pathlib import Path
from datetime import datetime, timezone

# Paths
CONVERSATIONS_JSON = Path("/tmp/chatgpt-import/conversations.json")
VAULT_ROOT = Path.home() / "Documents/DEF Master Vault/Master Vault/My Dashboard/Archives Dashboard/LLM Logs/ChatGPT Logs"

# Cutoff: last existing conversation is July 7, 2025 23:44:07
# Import everything AFTER this
CUTOFF = datetime(2025, 7, 7, 23, 44, 7, tzinfo=timezone.utc)


def safe_title(text: str, max_len: int = 60) -> str:
    """Sanitize title for filename"""
    # Remove/replace problematic chars
    result = ""
    for c in text.strip():
        if c.isalnum() or c in " -_":
            result += c
        elif c in ":/\\?*\"<>|":
            result += "-"
    # Clean up multiple spaces/dashes
    while "  " in result:
        result = result.replace("  ", " ")
    while "--" in result:
        result = result.replace("--", "-")
    result = result.strip(" -")
    if not result:
        result = "Untitled"
    return result[:max_len].rstrip(" -")


def extract_message_text(message: dict) -> str:
    """Extract text from various message content formats"""
    content = message.get("content")
    parts = []

    if isinstance(content, dict):
        if "parts" in content and isinstance(content["parts"], list):
            for p in content["parts"]:
                if isinstance(p, str):
                    parts.append(p)
        elif "text" in content:
            parts.append(content["text"])
    elif isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            elif isinstance(item, str):
                parts.append(item)

    return "\n\n".join(parts).strip()


def linearize_conversation(conv: dict) -> list:
    """Walk the conversation tree to get ordered messages"""
    mapping = conv.get("mapping", {})
    current_id = conv.get("current_node")
    ordered_nodes = []

    visited = set()
    while current_id and current_id not in visited:
        visited.add(current_id)
        node = mapping.get(current_id)
        if not node:
            break
        ordered_nodes.append(node)
        current_id = node.get("parent")

    ordered_nodes.reverse()

    messages = []
    for node in ordered_nodes:
        msg = node.get("message")
        if not msg:
            continue
        role = msg.get("author", {}).get("role", "")
        text = extract_message_text(msg)
        if not text or role not in ("user", "assistant"):
            continue
        messages.append((role, text))
    return messages


def conversation_to_markdown(conv: dict) -> str:
    """Convert conversation to markdown matching existing format"""
    title = conv.get("title") or "Untitled Conversation"
    created_ts = conv.get("create_time", 0) or 0
    created_dt = datetime.fromtimestamp(created_ts, tz=timezone.utc)
    date_str = created_dt.strftime("%Y-%m-%d %H-%M-%S")

    messages = linearize_conversation(conv)

    lines = []
    # YAML frontmatter matching existing format
    lines.append("---")
    lines.append(f'title: "{title.replace(chr(34), chr(39))}"')
    lines.append(f"date: {date_str}")
    lines.append("tags: [ai]")
    lines.append("---")
    lines.append("")
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"**Created:** {date_str}")
    lines.append("")
    lines.append("")

    for role, text in messages:
        pretty_role = "User" if role == "user" else "Assistant"
        lines.append(f"**{pretty_role}:**")
        lines.append("")
        lines.append(text)
        lines.append("")
        lines.append("")

    return "\n".join(lines)


def main():
    print(f"Loading conversations from {CONVERSATIONS_JSON}")
    with open(CONVERSATIONS_JSON, "r", encoding="utf-8") as f:
        conversations = json.load(f)

    print(f"Total conversations: {len(conversations)}")
    print(f"Cutoff date: {CUTOFF.isoformat()}")

    # Sort by creation time
    conversations.sort(key=lambda c: c.get("create_time") or 0)

    exported = 0
    skipped = 0

    for conv in conversations:
        created_ts = conv.get("create_time", 0) or 0
        if created_ts == 0:
            skipped += 1
            continue

        created_dt = datetime.fromtimestamp(created_ts, tz=timezone.utc)

        # Skip if before cutoff
        if created_dt <= CUTOFF:
            skipped += 1
            continue

        title = conv.get("title") or "Untitled Conversation"
        safe_t = safe_title(title)

        # Date components for folder structure
        year = created_dt.strftime("%Y")
        month = created_dt.strftime("%m")
        day = created_dt.strftime("%d")
        time_str = created_dt.strftime("%H-%M-%S")
        date_str = created_dt.strftime("%Y-%m-%d")

        # Folder: YYYY/MM/DD/
        folder = VAULT_ROOT / year / month / day
        folder.mkdir(parents=True, exist_ok=True)

        # Filename: 2025-07-07 20-16-43 - Title_md.md
        base_name = f"{date_str} {time_str} - {safe_t}_md.md"
        path = folder / base_name

        # Avoid overwriting
        counter = 2
        while path.exists():
            path = folder / f"{date_str} {time_str} - {safe_t}_{counter}_md.md"
            counter += 1

        md = conversation_to_markdown(conv)
        path.write_text(md, encoding="utf-8")
        exported += 1

        if exported % 100 == 0:
            print(f"  Exported {exported} conversations...")

    print(f"\nDone!")
    print(f"  Exported: {exported}")
    print(f"  Skipped (before cutoff or invalid): {skipped}")


if __name__ == "__main__":
    main()
