#!/usr/bin/env node

/**
 * Raw Session Logger for Claude Code
 *
 * Logs complete verbatim conversations to Obsidian vault
 * Like ChatGPT exports - full archive of everything said
 *
 * Uses transcript_path to capture BOTH user AND assistant messages
 *
 * Location: LLM Logs/Claude Code Logs/YYYY/MM-Month/DD/
 *
 * SYNC FEATURE: Also syncs any missing sessions from the JSONL directory
 * Every export also catches up on any sessions that weren't exported previously
 */

const fs = require('fs');
const path = require('path');

// CONFIGURE THESE PATHS FOR YOUR SETUP
const VAULT_BASE = '{{VAULT_PATH}}/My Dashboard/Archives Dashboard/LLM Logs/Claude Code Logs';
const JSONL_SOURCE = '{{HOME}}/.claude/projects/{{PROJECT_DIR}}';

// Read JSON input from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Only process on SessionEnd or Stop - when we have complete conversation
    if (data.hook_event_name === 'SessionEnd' || data.hook_event_name === 'Stop') {
      logFullTranscript(data);

      // Sync any missing sessions from the JSONL directory
      const synced = syncAllSessions();
      if (synced > 0) {
        console.log(`Synced ${synced} missing session(s) to vault`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Raw logging error:', err.message);
    process.exit(0); // Don't block on logging errors
  }
});

function logFullTranscript(data) {
  const transcriptPath = data.transcript_path;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    console.error('No transcript file found at:', transcriptPath);
    return;
  }

  // Skip agent/subagent transcripts - they're already summarized in main session
  if (path.basename(transcriptPath).startsWith('agent-')) {
    return;
  }

  // Use file's modification time for proper dating (not current time)
  const fileStat = fs.statSync(transcriptPath);
  const fileDate = fileStat.mtime;

  const year = fileDate.getFullYear().toString();
  const monthNum = (fileDate.getMonth() + 1).toString().padStart(2, '0');
  const monthName = fileDate.toLocaleString('default', { month: 'long' });
  const day = fileDate.getDate().toString().padStart(2, '0');
  const time = fileDate.toTimeString().slice(0, 8).replace(/:/g, '-');

  // Create directory: YYYY/MM-Month/DD/
  const logDir = path.join(VAULT_BASE, year, `${monthNum}-${monthName}`, day);
  fs.mkdirSync(logDir, { recursive: true });

  // Get 12-hour time format
  let hours = fileDate.getHours();
  const minutes = fileDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12; // Convert to 12hr, 0 becomes 12

  // Check if this session was already exported (by session_id in filename)
  const sessionId = data.session_id || path.basename(transcriptPath, '.jsonl');
  const shortId = sessionId.slice(0, 8); // First 8 chars for matching
  
  const existingFiles = fs.readdirSync(logDir);
  const existingSession = existingFiles.find(f => f.includes(shortId));
  
  let sessionFile;
  if (existingSession) {
    // Update existing file for this session
    sessionFile = path.join(logDir, existingSession);
  } else {
    // New session - get next sequence number
    const sequenceFiles = existingFiles.filter(f => f.match(/^\d{2}_Session_/));
    const sequenceNum = (sequenceFiles.length + 1).toString().padStart(2, '0');
    sessionFile = path.join(logDir, `${sequenceNum}_Session_${year}-${monthNum}-${day}_${hours}-${minutes}${ampm}_${shortId}.md`);
  }

  // Read and parse the JSONL transcript
  const transcriptContent = fs.readFileSync(transcriptPath, 'utf8');
  const lines = transcriptContent.trim().split('\n').filter(l => l.trim());

  let output = `# Claude Code Session Log\n\n`;
  output += `**Session ID:** ${sessionId}\n`;
  output += `**Date:** ${year}-${monthNum}-${day}\n`;
  output += `**Exported:** ${new Date().toISOString()}\n\n`;
  output += `---\n\n`;

  let lastRole = null;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const result = formatTranscriptEntry(entry, lastRole);
      output += result.content;
      if (result.role) lastRole = result.role;
    } catch (e) {
      // Skip malformed lines
    }
  }

  fs.writeFileSync(sessionFile, output, 'utf8');
}

function formatTranscriptEntry(entry, lastRole) {
  let content = extractContent(entry);

  // Clean out system reminders - they're noise
  content = content.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();

  if (!content) return { content: '', role: null };

  // Check if this is a tool result (comes as "user" but contains tool_result)
  const isToolResult = hasToolResult(entry);

  // Handle different message types
  if (entry.type === 'user' || entry.role === 'user') {
    if (isToolResult) {
      // Tool results go under Claude's section (they're responses to Claude's tool calls)
      return { content: `${content}\n\n`, role: 'assistant' };
    } else {
      // Actual human user message - add divider if coming from Claude
      const divider = lastRole === 'assistant' ? '---\n\n' : '';
      const header = lastRole === 'user' ? '' : `## 👤 You\n\n`;
      return { content: `${divider}${header}${content}\n\n`, role: 'user' };
    }
  }
  else if (entry.type === 'assistant' || entry.role === 'assistant') {
    // Only add header if switching from user to assistant
    const divider = lastRole === 'user' ? '---\n\n' : '';
    const header = lastRole === 'assistant' ? '' : `## 🤖 Claude\n\n`;
    return { content: `${divider}${header}${content}\n\n`, role: 'assistant' };
  }

  return { content: '', role: null };
}

function hasToolResult(entry) {
  // Check if entry contains tool_result blocks
  if (Array.isArray(entry.content)) {
    return entry.content.some(b => b.type === 'tool_result');
  }
  if (entry.message?.content && Array.isArray(entry.message.content)) {
    return entry.message.content.some(b => b.type === 'tool_result');
  }
  return false;
}

function cleanSystemReminders(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
}

function extractContent(entry, isToolResult = false) {
  // Handle various content formats
  if (typeof entry.content === 'string') {
    // Clean system reminders from string content
    return entry.content.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
  }
  if (Array.isArray(entry.content)) {
    return entry.content
      .map(block => {
        if (typeof block === 'string') return cleanSystemReminders(block);
        if (block.type === 'text') return cleanSystemReminders(block.text || '');

        // Thinking blocks - collapsible, strip signatures
        if (block.type === 'thinking') {
          const thinking = block.thinking || '';
          const preview = thinking.split('\n')[0].slice(0, 60) + '...';
          return `<details>\n<summary>💭 Thinking: ${preview}</summary>\n\n${thinking}\n\n</details>`;
        }

        // Image uploads - just show placeholder, not base64
        if (block.type === 'image') {
          const mediaType = block.source?.media_type || 'image';
          return `📷 *[Image uploaded: ${mediaType}]*`;
        }

        // Tool use - collapsible with summary
        if (block.type === 'tool_use') {
          const input = block.input || {};
          const summary = getToolSummary(block.name, input);
          const inputStr = formatToolInput(block.name, input);
          return `<details>\n<summary>🔧 ${block.name}: ${summary}</summary>\n\n${inputStr}\n\n</details>`;
        }

        // Tool result - collapsible
        if (block.type === 'tool_result') {
          const content = block.content || '';
          const truncated = smartTruncate(content);
          const preview = getResultPreview(content);
          return `<details>\n<summary>📋 Result: ${preview}</summary>\n\n${truncated}\n\n</details>`;
        }

        return JSON.stringify(block);
      })
      .join('\n\n');
  }
  if (entry.message?.content) {
    return extractContent({ content: entry.message.content });
  }
  // Fallback - clean any remaining system reminders
  return cleanSystemReminders(JSON.stringify(entry, null, 2));
}

function getToolSummary(toolName, input) {
  // One-line summary for the collapsed header
  if (toolName === 'Bash') return `\`${(input.command || '').slice(0, 50)}${input.command?.length > 50 ? '...' : ''}\``;
  if (toolName === 'Read') return `\`${input.file_path || ''}\``;
  if (toolName === 'Edit') return `\`${input.file_path || ''}\``;
  if (toolName === 'Write') return `\`${input.file_path || ''}\``;
  if (toolName === 'Grep') return `"${input.pattern || ''}"`;
  if (toolName === 'Glob') return `"${input.pattern || ''}"`;
  if (toolName === 'Task') return `${input.subagent_type || 'agent'}`;
  if (toolName === 'WebFetch') return `${input.url || ''}`;
  if (toolName === 'TodoWrite') return 'updating todos';
  return '';
}

function getResultPreview(content) {
  // Short preview for result header
  if (typeof content !== 'string') content = JSON.stringify(content);

  // Clean system reminders before analysis
  content = content.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();

  // Only flag as error if it looks like an actual error message
  if (content.startsWith('Error:') || content.startsWith('error:') ||
      content.includes('Exit code 1') || content.includes('command not found')) {
    return '⚠️ error';
  }
  if (content.length < 50) return content.replace(/\n/g, ' ').slice(0, 50);
  const lines = content.split('\n').length;
  return `${lines} lines`;
}

function formatToolInput(toolName, input) {
  // Format tool inputs in a readable way
  if (toolName === 'Bash') {
    return `\`\`\`bash\n${input.command || ''}\n\`\`\``;
  }
  if (toolName === 'Read') {
    return `**File:** \`${input.file_path || ''}\``;
  }
  if (toolName === 'Edit') {
    return `**File:** \`${input.file_path || ''}\`\n**Replace:** \`${(input.old_string || '').slice(0, 100)}${input.old_string?.length > 100 ? '...' : ''}\``;
  }
  if (toolName === 'Write') {
    const preview = (input.content || '').slice(0, 200);
    return `**File:** \`${input.file_path || ''}\`\n**Content preview:** \`${preview}${input.content?.length > 200 ? '...' : ''}\``;
  }
  if (toolName === 'Grep') {
    return `**Pattern:** \`${input.pattern || ''}\`\n**Path:** \`${input.path || '.'}\``;
  }
  if (toolName === 'Glob') {
    return `**Pattern:** \`${input.pattern || ''}\``;
  }
  if (toolName === 'Task') {
    return `**Agent:** ${input.subagent_type || 'unknown'}\n**Prompt:** ${(input.prompt || '').slice(0, 300)}${input.prompt?.length > 300 ? '...' : ''}`;
  }
  if (toolName === 'WebFetch') {
    return `**URL:** ${input.url || ''}\n**Prompt:** ${input.prompt || ''}`;
  }
  // Default: show as JSON but compact
  return `\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``;
}

function smartTruncate(content) {
  if (typeof content !== 'string') {
    content = JSON.stringify(content, null, 2);
  }

  // Clean system reminders from results too
  content = content.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();

  // For short content, show it all
  if (content.length <= 500) {
    return content;
  }

  // For file reads and long outputs, show first and last portions
  const lines = content.split('\n');
  if (lines.length > 30) {
    const head = lines.slice(0, 15).join('\n');
    const tail = lines.slice(-10).join('\n');
    return `${head}\n\n... [${lines.length - 25} lines omitted] ...\n\n${tail}`;
  }

  // For medium content, just truncate
  return content.slice(0, 800) + `\n\n... [${content.length - 800} chars truncated]`;
}

/**
 * Sync all sessions - find any JSONL files not yet exported and export them
 * Returns count of newly synced sessions
 */
function syncAllSessions() {
  if (!fs.existsSync(JSONL_SOURCE)) {
    return 0;
  }

  // Get all exported session IDs from vault (scan all date folders)
  const exportedIds = new Set();

  function scanVaultDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanVaultDir(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md') && entry.name.includes('_Session_')) {
        // Extract session ID from filename (last part before .md)
        const match = entry.name.match(/_([a-f0-9]{8})\.md$/);
        if (match) {
          exportedIds.add(match[1]);
        }
      }
    }
  }

  scanVaultDir(VAULT_BASE);

  // Get all JSONL files (excluding agent files and empty files)
  const jsonlFiles = fs.readdirSync(JSONL_SOURCE)
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));

  let syncedCount = 0;

  for (const jsonlFile of jsonlFiles) {
    const sessionId = path.basename(jsonlFile, '.jsonl');
    const shortId = sessionId.slice(0, 8);

    // Skip if already exported
    if (exportedIds.has(shortId)) {
      continue;
    }

    const transcriptPath = path.join(JSONL_SOURCE, jsonlFile);

    // Skip empty files
    const stat = fs.statSync(transcriptPath);
    if (stat.size === 0) {
      continue;
    }

    // Export this missing session
    try {
      logFullTranscript({
        session_id: sessionId,
        transcript_path: transcriptPath
      });
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync ${sessionId}:`, err.message);
    }
  }

  return syncedCount;
}
