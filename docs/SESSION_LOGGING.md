# Session Logging System

This system uses **dual logging** - two complementary approaches for different purposes.

## The Two Logs

| Log Type | Location | Created By | Purpose |
|----------|----------|------------|---------|
| **Summary Logs** | `Claude Dashboard/Session Logs/` | Claude (per CLAUDE.md) | Quick reference, searchable summaries |
| **Raw Transcripts** | `LLM Logs/Claude Code Logs/` | `raw_log.js` script | Full conversation history, debugging |

## Summary Logs

**What they are:** Condensed records of each exchange.

**Format:**
```markdown
## 14:30
**User:** Asked to refactor the authentication module
**Actions:**
- Read `src/auth/login.py`
- Edit `src/auth/login.py` - extracted validate_token function
- Write `src/auth/tokens.py` - new token utilities module
**Response:** Refactored auth module, extracted token handling to separate file

---
```

**How they're created:** Claude follows CLAUDE.md instructions to log after each exchange.

**When to use them:**
- "What did we do yesterday?"
- "Which file did we edit for that bug fix?"
- Quick session overview

## Raw Transcripts

**What they are:** Full conversation exports with all tool calls, outputs, and thinking.

**Format:** Markdown with collapsible sections for:
- Tool calls and their outputs
- Claude's thinking blocks
- System messages

**How they're created:** Manual export using `raw_log.js` after sessions.

**When to use them:**
- Debugging what went wrong
- Reviewing exact command outputs
- Training/improving prompts
- Full context recovery

## Important: Neither Auto-Fires

**Summary Logs:** Claude does this during the conversation, but only because CLAUDE.md instructs it to. If Claude forgets or you don't have CLAUDE.md set up, no logs.

**Raw Transcripts:** Requires manual export. The hook system doesn't auto-trigger on session end (known limitation).

## Workflow

1. **During session:** Claude logs summaries per CLAUDE.md
2. **After session:** Run `claude-export` alias to save raw transcript
3. **Next session:** Claude reads previous session log for context

## Tips

- Export raw logs every ~5 exchanges or at natural breakpoints
- Don't rely solely on raw logs - they're verbose and slow to search
- Summary logs are your quick reference; raw logs are your backup
- Both are plain markdown - searchable in Obsidian
