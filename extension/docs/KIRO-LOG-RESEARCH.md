# Kiro IDE Log Research - Complete Analysis

## 📍 Log Location

**Primary Location**: `/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`

This is the **global storage** location for Kiro Agent data, organized by workspace and session.

## 🗂️ Directory Structure

```
kiro.kiroagent/
├── config.json                    # Context providers configuration
├── profile.json                   # AWS profile information
├── .continuerc.json              # Continue configuration
├── .diffs/                       # Diff storage
├── .migrations/                  # Migration tracking
├── .utils/                       # Utility files
├── dev_data/                     # Development data
├── index/                        # Index files
│
├── workspace-sessions/           # ⭐ SESSION DATA BY WORKSPACE
│   ├── [base64-encoded-path]/   # One directory per workspace
│   │   └── sessions.json        # Session metadata
│   └── ...
│
├── [hash-id]/                    # ⭐ SESSION/WORKSPACE DIRECTORIES
│   ├── *.chat                    # Chat history files (JSON)
│   └── [hash-id]/               # Nested session data
│       └── [hash-id]            # Chat history files
│
└── default/                      # Default configuration
```

## 📊 Key Data Structures

### 1. **Workspace Sessions Directory**

**Location**: `workspace-sessions/[base64-workspace-path]/`

**Example**:
- Encoded: `L1VzZXJzL2hhcnByZWV0c2lkZGh1L0RvY3VtZW50cy9Qcm9qZWN0cy9LaXJvRm9yZ2Uva2lyb2ZvcmdlLWluc2lnaHRz`
- Decoded: `/Users/harpreetsiddhu/Documents/Projects/KiroForge/kiroforge-insights`

**Contents**:
- `sessions.json` - Array of session metadata

### 2. **Chat History Files (.chat)**

**Location**: `[hash-id]/*.chat`

**Format**: JSON with complete conversation history

**Structure**:
```json
{
  "chat": [
    {
      "role": "human",
      "content": "..."
    },
    {
      "role": "bot",
      "content": "..."
    },
    {
      "role": "tool",
      "content": "..."
    }
  ],
  "validations": {
    "editorProblems": {}
  }
}
```

**Key Fields**:
- `role`: "human", "bot", or "tool"
- `content`: Full message content (can be very large)
- `validations`: Editor problems and diagnostics

### 3. **Configuration Files**

#### **config.json**
```json
{
  "contextProviders": [
    {"name": "code", "params": {}},
    {"name": "docs", "params": {}},
    {"name": "repo-map", "params": {}},
    {"name": "diff", "params": {}},
    {"name": "terminal", "params": {}},
    {"name": "problems", "params": {}},
    {"name": "folder", "params": {}},
    {"name": "codebase", "params": {}},
    {"name": "url", "params": {}},
    {"name": "currentFile", "params": {}},
    {"name": "steering", "params": {}},
    {"name": "spec", "params": {}}
  ]
}
```

#### **profile.json**
```json
{
  "arn": "arn:aws:codewhisperer:us-east-1:681330366826:profile/XV7X7XVKK4UC",
  "name": "Kiro-us-east-1"
}
```

## 💎 Available Metrics

### From Chat History Files (.chat)

#### 1. **Conversation Metrics**
- ✅ **Message Count**: Count of human/bot/tool messages
- ✅ **Conversation Length**: Total messages in session
- ✅ **Message Timestamps**: Embedded in system prompts
- ✅ **Role Distribution**: Human vs Bot vs Tool messages
- ✅ **Conversation Content**: Full text of all interactions

#### 2. **Session Information**
- ✅ **Session ID**: Hash-based identifiers
- ✅ **Workspace Path**: Base64-encoded in directory name
- ✅ **Active Sessions**: From workspace-sessions directories
- ✅ **Session Files**: Multiple .chat files per session

#### 3. **Tool Usage**
- ✅ **Tool Executions**: Messages with role="tool"
- ✅ **Tool Results**: Output from tool executions
- ✅ **File Operations**: Tracked in tool messages
- ✅ **Command Executions**: Bash commands and results

#### 4. **Context Providers**
- ✅ **Available Providers**: From config.json
- ✅ **Provider Types**: code, docs, repo-map, diff, terminal, problems, folder, codebase, url, currentFile, steering, spec

#### 5. **Validation Data**
- ✅ **Editor Problems**: From validations.editorProblems
- ✅ **Diagnostics**: Code issues and warnings

### From Directory Structure

#### 6. **Workspace Tracking**
- ✅ **Workspace List**: All base64-encoded workspace paths
- ✅ **Workspace Activity**: Last modified timestamps
- ✅ **Session Count**: Number of sessions per workspace

#### 7. **File Metadata**
- ✅ **File Sizes**: Chat history file sizes (80KB - 700KB+)
- ✅ **File Counts**: Number of chat files per session
- ✅ **Last Modified**: Timestamps on all files

## 📈 Metrics We Can Calculate

### Session Analytics
1. **Total Sessions**: Count of unique hash directories
2. **Sessions Per Workspace**: Group by workspace path
3. **Session Duration**: First to last message timestamp
4. **Active Sessions**: Sessions modified today/this week

### Conversation Analytics
1. **Messages Per Session**: Count messages in each .chat file
2. **Average Message Length**: Character count analysis
3. **Human vs Bot Ratio**: Percentage of each role
4. **Tool Usage Frequency**: Count of tool messages

### Productivity Metrics
1. **Daily Activity**: Sessions and messages per day
2. **Weekly Trends**: Activity patterns over time
3. **Peak Hours**: Most active times (from timestamps)
4. **Workspace Usage**: Most active workspaces

### Quality Indicators
1. **Validation Issues**: Count of editor problems
2. **Tool Success Rate**: Successful vs failed tool executions
3. **Conversation Depth**: Back-and-forth exchanges
4. **Session Completion**: Sessions with clear endings

## 🔍 Data Extraction Strategy

### Phase 1: Basic Parsing
```javascript
// 1. List all hash directories
const sessionDirs = fs.readdirSync(kiroAgentPath)
  .filter(d => d.match(/^[a-f0-9]{32}$/));

// 2. Read chat files
const chatFiles = fs.readdirSync(sessionDir)
  .filter(f => f.endsWith('.chat'));

// 3. Parse JSON
const chatData = JSON.parse(fs.readFileSync(chatFile));

// 4. Extract metrics
const messageCount = chatData.chat.length;
const humanMessages = chatData.chat.filter(m => m.role === 'human').length;
const botMessages = chatData.chat.filter(m => m.role === 'bot').length;
const toolMessages = chatData.chat.filter(m => m.role === 'tool').length;
```

### Phase 2: Workspace Mapping
```javascript
// 1. Decode workspace paths
const workspacePath = Buffer.from(encodedPath, 'base64').toString('utf-8');

// 2. Map sessions to workspaces
const workspaceSessions = {};
workspaceDirs.forEach(dir => {
  const path = decodeWorkspacePath(dir);
  workspaceSessions[path] = readSessionsJson(dir);
});
```

### Phase 3: Timeline Analysis
```javascript
// 1. Extract timestamps from system prompts
const dateMatch = content.match(/Date: (.*?)\n/);
const date = new Date(dateMatch[1]);

// 2. Build timeline
const timeline = chatData.chat.map((msg, idx) => ({
  index: idx,
  role: msg.role,
  timestamp: estimateTimestamp(idx, totalMessages, sessionStart, sessionEnd)
}));
```

## 🚫 Limitations

### NOT Available in This Location
- ❌ **Token Usage**: No token counts in chat files
- ❌ **Model Information**: No model selection data
- ❌ **API Performance**: No API call metrics
- ❌ **Compression Events**: No compression data
- ❌ **System Configuration**: No Java version info
- ❌ **Terminal Commands**: No direct terminal logs
- ❌ **File Watcher Events**: No file system monitoring

### Requires Additional Sources
These metrics need the `/logs/` directory:
- Token usage and limits
- Model selection and capabilities
- API performance and errors
- Compression statistics
- System configuration
- Terminal command execution
- File modification tracking

## 💡 Implementation Recommendations

### High Priority (Implement First)
1. **Session Discovery**
   - Scan hash directories
   - Identify active sessions
   - Map to workspaces

2. **Chat History Parsing**
   - Read .chat files
   - Parse JSON structure
   - Extract message counts

3. **Workspace Analytics**
   - Decode workspace paths
   - Track sessions per workspace
   - Calculate activity metrics

### Medium Priority (Implement Later)
1. **Timeline Analysis**
   - Extract timestamps
   - Build session timelines
   - Calculate durations

2. **Tool Usage Tracking**
   - Parse tool messages
   - Track tool types
   - Calculate success rates

3. **Validation Tracking**
   - Extract editor problems
   - Track issue types
   - Calculate quality scores

### Low Priority (Nice to Have)
1. **Content Analysis**
   - Message length analysis
   - Topic extraction
   - Conversation patterns

2. **Historical Trends**
   - Daily/weekly patterns
   - Growth trends
   - Usage patterns

## 🎯 Key Insights

### What Makes This Valuable
1. **Complete Conversation History**: Every interaction is preserved
2. **Workspace Context**: Sessions mapped to specific projects
3. **Tool Execution Tracking**: Full record of tool usage
4. **Validation Data**: Editor problems and diagnostics
5. **Multi-Session Support**: Track multiple concurrent sessions

### Unique Advantages
- **Global Storage**: All workspaces in one location
- **JSON Format**: Easy to parse and analyze
- **Rich Context**: Full conversation content
- **Workspace Mapping**: Clear project associations
- **File-Based**: No database required

## 📝 Sample Data Points

### From Actual Files

**Session Count**: 27 hash directories found
**Workspace Count**: 18 unique workspaces
**Chat Files**: 16 .chat files in current session
**File Sizes**: Range from 42KB to 711KB
**Last Activity**: November 21, 2025 14:38

**Example Workspace Paths** (decoded):
- `/Users/harpreetsiddhu/Documents/Projects/KiroForge/kiroforge-insights`
- `/Users/harpreetsiddhu/Documents/Projects/test`
- `/Users/harpreetsiddhu/Documents/Projects/unicorn-academy`
- `/Users/harpreetsiddhu/Documents/Projects/kiro-analytics`
- `/Users/harpreetsiddhu/Documents/Projects/pulseai-aidlc-kiro`

## 🚀 Next Steps

1. **Create Log Reader Service**
   - Scan kiro.kiroagent directory
   - Parse .chat files
   - Extract metrics

2. **Build Session Tracker**
   - Track active sessions
   - Calculate durations
   - Map to workspaces

3. **Implement Analytics**
   - Message counts
   - Tool usage
   - Workspace activity

4. **Create Dashboard**
   - Display metrics
   - Show trends
   - Export data

---

**Research Completed**: November 21, 2025
**Location Analyzed**: `/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
**Status**: ✅ COMPLETE - Ready for implementation
