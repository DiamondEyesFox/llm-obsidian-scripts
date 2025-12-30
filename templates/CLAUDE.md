# Claude Code System Instructions

## Core Behavior
- **Memory System**: Obsidian vault at `{{VAULT_PATH}}` is your persistent memory
- **Claude Dashboard**: `{{VAULT_PATH}}/Claude Dashboard/`
- **Session Logs**: Always create at session start, append after every exchange
  - Path: `Claude Dashboard/Session Logs/YYYY/MM-Month/DD/Session Log YYYY-MM-DD.md`
  - Create day folder if it doesn't exist
  - Format for each exchange:
    ```
    ## HH:MM
    **User:** [paraphrased request/intent]
    **Actions:** [tool calls with full paths/parameters]
    **Response:** [summary of response given]
    ```
  - Log all tool calls (edits, writes, commands, searches)
  - Include full file paths in actions
  - Log failed attempts briefly
- **When you don't know something**: Check the vault first before asking
- **Vault access**: Use filesystem tools (Read, Edit, Glob, Grep) - no Obsidian MCP needed

## Documentation Locations
- `Claude Dashboard/Inbox` = files given to process
  - `To Process`, `Context`, `Requests`
- `Claude Dashboard/Outbox` = files I create
  - `_Latest`, `Reports/`, `Guides/`, `Projects/`
- `Claude Dashboard/Session Logs` = session records (YYYY/MM-Month/DD structure)
- `Claude Dashboard/Scratchpad.md` = drafts, partial work, working notes
- `Claude Dashboard/Reference` = persistent context
  - `System`, `User`, `Knowledge Base/Known Issues`, `Knowledge Base/Solutions`
- `Claude Dashboard/Archive` = old or superseded content

## Scratchpad Usage
Use `Claude Dashboard/Scratchpad.md` as working memory during sessions:
- **Multi-step tasks**: Track state, hypotheses, what's been tried
- **Debugging**: Note failed approaches before they scroll away
- **Cross-session notes**: Things to investigate later, unfinished ideas
- **Tool issues**: When MCPs or tools misbehave, note it for later diagnosis

Format: Date header → brief note. Clear resolved items periodically.

## Known Issues Workflow
Use `Claude Dashboard/Reference/Knowledge Base/Known Issues/` to track problems:
- **Before troubleshooting**: Check if issue is already documented
- **After solving**: Update the issue file or move to Solutions

## Workflow Preferences
- **Documentation reading**: Read docs thoroughly before implementing new systems
- **Stability first**: Warn about experimental features, suggest testing first
- **Confirmation before changes**: Ask before permanent system changes or sudo
- **Testing workflow**: Preview/demo → approval → apply permanently
- **Backup strategy**: Create timestamped backups before modifying configs

## Raw Session Logs (Full Transcripts)
- **Location**: `{{RAW_LOGS_PATH}}/YYYY/MM-Month/DD/`
- **Format**: `01_Session_YYYY-MM-DD_H-MMam/pm_shortID.md`
- **Contains**: Full conversation with collapsible tool calls and thinking
- **Export cadence**: Every ~5 exchanges or at natural breakpoints
- **Manual export**: See `scripts/raw_log.js` for usage

## Session Startup Protocol
When starting a new session:
1. Check **Todo.md** for pending tasks: `Claude Dashboard/Todo.md`
2. Read today's **Session Log** first (quick summary): `Session Logs/YYYY/MM-Month/DD/`
3. If more context needed, read latest **Raw Log** (last 300-500 lines)
4. Check **Scratchpad.md** for pending items
5. Look for SESSION HANDOFF sections in logs for explicit context

---

## Configuration

Replace these placeholders before use:
- `{{VAULT_PATH}}` - Full path to your Obsidian vault (e.g., `~/Documents/My Vault`)
- `{{RAW_LOGS_PATH}}` - Where raw transcripts go (e.g., `{{VAULT_PATH}}/LLM Logs/Claude Code Logs`)
