# LLM Logs to Obsidian

Scripts to ingest AI chat logs into an Obsidian vault for searchable, permanent storage.

## Scripts

### 1. `chatgpt-import.py` - ChatGPT Conversation Importer

Imports ChatGPT conversation exports into your Obsidian vault as markdown files.

**How to use:**

1. Export your data from ChatGPT: Settings → Data Controls → Export Data
2. Extract `conversations.json` from the zip:
   ```bash
   mkdir -p /tmp/chatgpt-import
   unzip ~/Downloads/your-export.zip conversations.json -d /tmp/chatgpt-import/
   ```
3. Edit the script to set your vault path and cutoff date
4. Run:
   ```bash
   python3 chatgpt-import.py
   ```

**Configuration (edit in script):**
- `CONVERSATIONS_JSON` - path to extracted conversations.json
- `VAULT_ROOT` - path to output folder in your vault
- `CUTOFF` - datetime to skip conversations before (prevents re-importing)

**Output:**
- Creates `YYYY/MM/DD/` folder structure
- Filename format: `YYYY-MM-DD HH-MM-SS - Title_md.md`
- YAML frontmatter + User/Assistant message format

---

### 2. `raw_log.js` - Claude Code Session Logger (Hook)

A Claude Code hook that saves full conversation transcripts to Obsidian when sessions end.

**Installation:**

1. Copy to your Claude hooks directory:
   ```bash
   cp raw_log.js ~/.claude/hooks/
   ```

2. Add to your Claude settings (`.claude/settings.json`):
   ```json
   {
     "hooks": {
       "Stop": [
         {
           "type": "command",
           "command": "echo '$CLAUDE_HOOK_INPUT' | node ~/.claude/hooks/raw_log.js"
         }
       ]
     }
   }
   ```

3. Edit the script to set your vault path at the top.

**What it does:**
- Triggers on session end (Stop hook)
- Reads the JSONL transcript file
- Converts to readable markdown with:
  - Collapsible tool calls
  - Truncated long outputs (smart truncation)
  - Thinking blocks (collapsed)
  - System reminders preserved
- Outputs to `YYYY/MM-Month/DD/` folder structure

**Output format:**
- Filename: `01_Session_YYYY-MM-DD_H-MMam_shortID.md`
- Re-exports update the same file (uses session ID for deduplication)
- Full conversation preserved with formatting

---

## Vault Structure

Both scripts output to an `LLM Logs` folder structure like:

```
My Vault/
├── LLM Logs/
│   ├── ChatGPT Logs/
│   │   └── 2025/
│   │       └── 12/
│   │           └── 28/
│   │               └── 2025-12-28 14-30-00 - Conversation Title_md.md
│   └── Claude Code Logs/
│       └── 2025/
│           └── 12-December/
│               └── 28/
│                   └── 01_Session_2025-12-28_2-30pm_abc123.md
```

## Requirements

- **Python 3.6+** for chatgpt-import.py
- **Node.js** for raw_log.js
- **Obsidian** vault (any markdown folder works)
- **Claude Code** CLI for the hooks feature

## License

MIT - do whatever you want with these.
