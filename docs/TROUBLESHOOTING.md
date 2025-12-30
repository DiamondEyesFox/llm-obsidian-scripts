# Troubleshooting

Common issues and solutions.

## Session Logging Issues

### Claude isn't logging sessions

**Symptoms:** No entries in `Session Logs/` folder

**Causes:**
1. CLAUDE.md not in home directory or project root
2. CLAUDE.md instructions not being followed

**Solutions:**
- Verify `~/CLAUDE.md` exists and has correct content
- Remind Claude: "Please log this exchange to the session log"
- Check Claude's context - it may have forgotten mid-conversation

### Log format is inconsistent

**Symptoms:** Different formats across sessions

**Solution:** The format is only as consistent as Claude follows it. Explicitly reference the format in CLAUDE.md or remind Claude of the expected structure.

---

## Raw Log Export Issues

### Hook doesn't auto-fire

**Symptoms:** Have to manually run export after every session

**This is expected.** The SessionEnd hook doesn't reliably trigger. Manual export is the current workflow:

```bash
claude-export  # if you set up the alias
```

### raw_log.js errors

**Symptoms:** Script fails with path or module errors

**Solutions:**
1. Check `VAULT_ROOT` is set correctly in the script
2. Ensure Node.js is installed: `node --version`
3. Check the transcript path exists: `ls ~/.claude/projects/`

### No JSONL files found

**Symptoms:** "No transcript found" when trying to export

**Causes:**
- Session was too short
- Wrong project directory

**Solution:** Check for files manually:
```bash
ls -la ~/.claude/projects/-home-*/*.jsonl
```

---

## ChatGPT Import Issues

### Import creates duplicates

**Symptoms:** Same conversations appearing multiple times

**Solution:** Set the `CUTOFF` date in `chatgpt-import.py` to after your last import:
```python
CUTOFF = datetime(2025, 1, 15, 0, 0, 0)  # Skip before this date
```

### Unicode errors

**Symptoms:** Script crashes on special characters

**Solution:** Ensure Python 3 and proper encoding:
```bash
python3 scripts/chatgpt-import.py
```

---

## Obsidian Issues

### Files not appearing in Obsidian

**Symptoms:** Script says success but files not visible

**Causes:**
1. Vault path is wrong
2. Obsidian not refreshing

**Solutions:**
- Verify the output path matches your vault
- Click in Obsidian's file explorer to refresh
- Check if files exist: `ls ~/path/to/vault/Claude\ Dashboard/`

### Links not working

**Symptoms:** `[[WikiLinks]]` show as broken

**Solution:** Obsidian needs the target files to exist. The template includes basic files, but you may need to create others referenced in your notes.

---

## Still Stuck?

1. Check the script comments for configuration details
2. Run scripts with debug output if available
3. Open an issue on GitHub with:
   - What you tried
   - Error messages
   - Your OS and tool versions
