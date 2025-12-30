# LLM Logs to Obsidian

A complete system for integrating Claude Code with Obsidian - conversation logging, imports, and organized knowledge management.

## What's Included

| Component | Description |
|-----------|-------------|
| **Import Scripts** | Import ChatGPT history and export Claude Code transcripts |
| **CLAUDE.md Template** | Instructions for Claude to log sessions automatically |
| **Vault Structure** | Ready-to-use Obsidian folder structure |
| **Documentation** | Setup guides and troubleshooting |

## Quick Start

1. **Clone this repo:**
   ```bash
   git clone https://github.com/DiamondEyesFox/llm-obsidian-scripts.git
   cd llm-obsidian-scripts
   ```

2. **Copy vault structure to your Obsidian vault:**
   ```bash
   cp -r templates/vault-structure/Claude\ Dashboard/ ~/Documents/YourVault/
   ```

3. **Set up CLAUDE.md:**
   ```bash
   cp templates/CLAUDE.md ~/CLAUDE.md
   # Edit and replace {{VAULT_PATH}} with your vault path
   ```

4. **Configure scripts:**
   ```bash
   mkdir -p ~/.claude/hooks
   cp scripts/raw_log.js ~/.claude/hooks/
   # Edit and set VAULT_ROOT in the script
   ```

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

## The Dual Logging System

This system uses two complementary logs:

| Log Type | Purpose | Created By |
|----------|---------|------------|
| **Summary Logs** | Quick reference, searchable | Claude (auto, per CLAUDE.md) |
| **Raw Transcripts** | Full history, debugging | `raw_log.js` (manual export) |

**Important:** Neither fully auto-fires. Summary logs depend on Claude following CLAUDE.md instructions. Raw exports require running a command after sessions.

See [docs/SESSION_LOGGING.md](docs/SESSION_LOGGING.md) for details.

## Repository Structure

```
llm-obsidian-scripts/
├── scripts/
│   ├── chatgpt-import.py    # Import ChatGPT exports
│   └── raw_log.js           # Export Claude Code transcripts
├── templates/
│   ├── CLAUDE.md            # Claude Code instructions
│   └── vault-structure/     # Obsidian folder template
│       └── Claude Dashboard/
├── docs/
│   ├── SETUP.md             # Installation guide
│   ├── SESSION_LOGGING.md   # How logging works
│   └── TROUBLESHOOTING.md   # Common issues
└── examples/
    └── sample-session-log.md
```

## Vault Structure

After setup, your vault will have:

```
Your Vault/
├── Claude Dashboard/
│   ├── Inbox/           # Files for Claude to process
│   ├── Outbox/          # Files Claude creates
│   ├── Reference/       # Persistent context
│   ├── Session Logs/    # Daily summaries
│   ├── Scratchpad.md    # Working memory
│   └── Todo.md          # Pending tasks
└── LLM Logs/
    ├── ChatGPT Logs/    # Imported history
    └── Claude Code Logs/ # Raw transcripts
```

## Scripts

### chatgpt-import.py

Imports ChatGPT conversation exports into Obsidian.

```bash
# Export from ChatGPT: Settings → Data Controls → Export Data
unzip ~/Downloads/chatgpt-export.zip conversations.json -d /tmp/
python3 scripts/chatgpt-import.py
```

### raw_log.js

Converts Claude Code JSONL transcripts to readable markdown.

```bash
# Manual export (add as alias for convenience)
TRANSCRIPT=$(ls -t ~/.claude/projects/-home-*/*.jsonl | grep -v agent | head -1)
SESSION_ID=$(basename "$TRANSCRIPT" .jsonl)
echo "{\"session_id\":\"$SESSION_ID\",\"transcript_path\":\"$TRANSCRIPT\"}" | node ~/.claude/hooks/raw_log.js
```

## Requirements

- Claude Code CLI
- Obsidian (or any markdown-based notes system)
- Python 3.6+
- Node.js

## Known Limitations

- **No auto-export:** Raw transcript export is manual (hook doesn't auto-fire on session end)
- **Summary logs depend on Claude:** If Claude forgets or ignores CLAUDE.md, no logs
- **Not a plugin:** This is a workflow system using plain files, not an Obsidian plugin

## License

MIT - do whatever you want with these.

## Contributing

Issues and PRs welcome. This is a personal workflow shared publicly - your mileage may vary.
