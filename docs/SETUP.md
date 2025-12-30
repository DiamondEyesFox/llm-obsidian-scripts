# Setup Guide

Complete setup for Claude Code + Obsidian integration.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- [Obsidian](https://obsidian.md/) vault
- Python 3.6+ (for ChatGPT import)
- Node.js (for raw log export)

## Quick Start

### 1. Copy the Vault Structure

Copy `templates/vault-structure/Claude Dashboard/` to your Obsidian vault:

```bash
cp -r templates/vault-structure/Claude\ Dashboard/ ~/Documents/YourVault/
```

### 2. Configure CLAUDE.md

Copy and customize the template:

```bash
cp templates/CLAUDE.md ~/CLAUDE.md
```

Edit and replace:
- `{{VAULT_PATH}}` → Your vault path (e.g., `~/Documents/My Vault`)
- `{{RAW_LOGS_PATH}}` → Where raw transcripts go (e.g., `~/Documents/My Vault/LLM Logs/Claude Code Logs`)

### 3. Set Up Scripts

#### ChatGPT Import (optional)

If you have ChatGPT history to import:

1. Export from ChatGPT: Settings → Data Controls → Export Data
2. Edit `scripts/chatgpt-import.py`:
   - Set `VAULT_ROOT` to your logs folder
   - Set `CUTOFF` date to avoid re-importing
3. Run:
   ```bash
   unzip ~/Downloads/chatgpt-export.zip conversations.json -d /tmp/
   python3 scripts/chatgpt-import.py
   ```

#### Raw Log Export

1. Copy script to Claude hooks folder:
   ```bash
   mkdir -p ~/.claude/hooks
   cp scripts/raw_log.js ~/.claude/hooks/
   ```
2. Edit `~/.claude/hooks/raw_log.js` and set `VAULT_ROOT` at the top

## Usage

### Session Logging (Summary)

Claude does this automatically if CLAUDE.md is configured:
- Creates `Session Logs/YYYY/MM-Month/DD/Session Log YYYY-MM-DD.md`
- Appends each exchange with timestamp, user request, actions, response

### Raw Transcript Export (Manual)

After a session, export the full transcript:

```bash
TRANSCRIPT=$(ls -t ~/.claude/projects/-home-*/*.jsonl | grep -v agent | head -1)
SESSION_ID=$(basename "$TRANSCRIPT" .jsonl)
echo "{\"session_id\":\"$SESSION_ID\",\"transcript_path\":\"$TRANSCRIPT\"}" | node ~/.claude/hooks/raw_log.js
```

Or add to your `.bashrc`:
```bash
alias claude-export='TRANSCRIPT=$(ls -t ~/.claude/projects/-home-*/*.jsonl | grep -v agent | head -1) && SESSION_ID=$(basename "$TRANSCRIPT" .jsonl) && echo "{\"session_id\":\"$SESSION_ID\",\"transcript_path\":\"$TRANSCRIPT\"}" | node ~/.claude/hooks/raw_log.js'
```

Then just run `claude-export` after sessions.

## Folder Structure After Setup

```
Your Vault/
├── Claude Dashboard/
│   ├── 00 - Index.md
│   ├── Scratchpad.md
│   ├── Todo.md
│   ├── Inbox/
│   │   ├── To Process/
│   │   ├── Context/
│   │   └── Requests/
│   ├── Outbox/
│   │   ├── _Latest/
│   │   ├── Guides/
│   │   ├── Projects/
│   │   └── Reports/
│   ├── Reference/
│   │   ├── System/
│   │   ├── User/
│   │   └── Knowledge Base/
│   ├── Session Logs/
│   └── Archive/
└── LLM Logs/
    ├── ChatGPT Logs/     (if imported)
    └── Claude Code Logs/  (raw transcripts)
```

## Next Steps

- Read [[SESSION_LOGGING]] to understand the dual logging system
- Check [[TROUBLESHOOTING]] if you hit issues
