# Core Services Architecture

This document provides a comprehensive overview of the KiroForge extension's core services, their responsibilities, interfaces, and interactions.

## Service Overview

KiroForge follows a service-oriented architecture with six core services:

1. **PackManager**: Steering pack discovery, download, and installation
2. **HookRegistry**: Validation hook registration and execution
3. **MetricsCollector**: Metrics collection and offline queue management
4. **AnalyticsService**: Kiro log parsing and productivity analytics
5. **StorageManager**: File system operations and state persistence
6. **LogParser**: Kiro runtime log monitoring (simplified implementation)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Extension Core                              │
│                    (extension.ts)                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             │              │              │              │
             ▼              ▼              ▼              ▼
      ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
      │   Pack   │   │   Hook   │  │ Metrics  │  │Analytics │
      │ Manager  │   │ Registry │  │Collector │  │ Service  │
      └──────────┘   └──────────┘  └──────────┘  └──────────┘
             │              │              │              │
             └──────────────┴──────────────┴──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │   Storage    │
                   │   Manager    │
                   └──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │ File System  │
                   │  & State     │
                   └──────────────┘
```

## 1. PackManager Service

### Responsibility
Manages the complete lifecycle of steering packs: discovery, download, installation, and uninstallation.

### Key Features
- Fetches pack index from S3
- Downloads pack manifests and files
- Installs files to appropriate directories
- Maintains persistent state of installed packs
- Handles pack updates and version management

### Interface
```typescript
class PackManager {
  constructor(storageManager: StorageManager)
  
  // Pack discovery
  async discoverPacks(): Promise<Pack[]>
  getAvailablePacks(): Pack[]
  getInstalledPacks(): InstalledPack[]
  
  // Pack installation
  async showPackInstallationDialog(): Promise<number>
  async installPack(pack: Pack): Promise<void>
  async uninstallPack(packName: string): Promise<void>
  
  // Pack management
  async refreshPacks(): Promise<void>
  async loadInstalledPacks(): Promise<void>
  async cleanupAllPacks(): Promise<void>
}
```

### File Organization
Packs are installed to three directories:
- `.kiro/steering/` - AI guidance markdown files
- `.kiro/kiroforge/hooks/` - Validation hook JSON files
- `.kiro/hooks/` - Kiro agent hook files (`.kiro.hook`)

### Installation Flow
1. Fetch pack index from S3
2. Display available packs to user
3. Download pack manifest
4. Download steering files → save to `.kiro/steering/`
5. Download validation hooks → save to `.kiro/kiroforge/hooks/`
6. Download Kiro hooks → rename `.json` to `.kiro.hook` → save to `.kiro/hooks/`
7. Register pack in persistent storage

### Error Handling
- Network failures: Display error, don't register pack
- File system errors: Catch and report, rollback if possible
- Partial downloads: Clean up incomplete installations



## 2. HookRegistry Service

### Responsibility
Registers validation hooks from installed packs and executes them against documents with comprehensive safety mechanisms.

### Key Features
- Registers hooks from all installed packs
- Matches hooks to documents by file extension
- Executes validation with timeout protection
- Creates VS Code diagnostics for violations
- Collects metrics for violations (fire-and-forget)

### Interface
```typescript
class HookRegistry {
  constructor(storageManager: StorageManager, metricsCollector?: MetricsCollector)
  
  // Hook registration
  async registerInstalledHooks(): Promise<void>
  async registerPackHooks(packName: string, hookFiles: string[]): Promise<void>
  setMetricsCollector(metricsCollector: MetricsCollector): void
  
  // Validation
  async validateDocument(document: TextDocument): Promise<ValidationResult>
  
  // Diagnostics management
  clearFileDiagnostics(uri: Uri): void
  clearAllDiagnostics(): void
  async showIssuesPanel(): Promise<void>
  
  // Internal
  private getApplicableHooks(fileExtension: string, fileName: string): Hook[]
  private isHookApplicable(hook: Hook, fileExtension: string, fileName: string): boolean
  private async executeHook(hook: Hook, document: TextDocument): Promise<Violation[]>
  private async executeRegexValidation(...): Promise<Violation[]>
  private executeFilenameValidation(...): Violation[]
  private executeFilesizeValidation(...): Violation[]
  private updateDiagnostics(document: TextDocument, violations: Violation[]): void
}
```

### Safety Mechanisms

#### 1. Timeout Protection
- Uses `AbortController` for proper cancellation
- Configurable timeout (default 500ms, configurable via `hookTimeout` setting)
- Aborts long-running validations without failing overall validation
- Logs warnings for timed-out hooks

#### 2. Regex Safety
- Skips patterns with nested quantifiers (`*.*\*`, `+.*+`, etc.)
- Limits line length (1000 characters max)
- Limits matches per line (50 max)
- Limits total violations (200 max)
- Uses `matchAll` for safer iteration

#### 3. File Size Limits
- Skips files exceeding configured line limit (default 5000 lines)
- Prevents memory exhaustion on large files
- Configurable via `maxFileSizeForValidation` setting

#### 4. Concurrent Validation Throttling
- Maximum 3 concurrent validations
- Validation queue prevents overload
- Reuses promises for duplicate validation requests

#### 5. Error Isolation
- Each hook execution wrapped in try-catch
- Hook failures don't stop other hooks
- Errors logged but don't crash validation

### Validation Flow
1. Check if document is in validation queue (reuse if exists)
2. Check file size limit (skip if too large)
3. Get applicable hooks based on file extension
4. For each hook:
   - Start timeout timer with AbortController
   - Execute validation (regex/filename/filesize)
   - Check abort signal periodically
   - Collect violations
   - Clear timeout
5. Update VS Code diagnostics
6. Send metrics asynchronously (fire-and-forget)
7. Return validation result

### Hook Matching
Hooks match documents based on:
- `fileTypes` array contains file extension
- `fileTypes` contains `'*'` (matches all)
- Special cases: `'dockerfile'` matches filenames containing "dockerfile"

### Diagnostic Creation
Each violation creates a VS Code diagnostic with:
- Range: line and column from violation
- Severity: mapped from hook severity (error/warning/info)
- Message: from hook validation rule
- Source: "KiroForge"
- Code: hook ID



## 3. MetricsCollector Service

### Responsibility
Collects anonymized usage metrics and sends them to the backend API with robust offline support and exponential backoff retry logic.

### Key Features
- Queues metrics in memory with size limits
- Batches metrics for efficient network usage
- Persists offline queue across restarts
- Retries failed sends with exponential backoff
- Anonymizes developer IDs
- Detects team names from Git config

### Interface
```typescript
class MetricsCollector {
  constructor(storageManager: StorageManager)
  
  // Metric collection
  async collectViolationMetric(violation: Violation): Promise<void>
  async collectSteeringUsageMetric(file: string, operation: string, context: string): Promise<void>
  async collectPackInstallMetric(name: string, version: string, time: number, success: boolean): Promise<void>
  
  // Queue management
  async flush(): Promise<void>
  getOfflineQueueStatus(): { size: number; isOnline: boolean }
  async retryOfflineQueue(): Promise<void>
  async clearOfflineQueue(): Promise<void>
  
  // Configuration
  updateConfig(): void
  async cleanup(): Promise<void>
  
  // Internal
  private queueMetric(metric: Metric): void
  private async addToOfflineQueue(metrics: Metric[]): Promise<void>
  private async processOfflineQueue(): Promise<void>
  private startFlushTimer(): void
  private stopFlushTimer(): void
  private startRetryTimer(): void
  private stopRetryTimer(): void
}
```

### Metrics Flow

#### 1. Collection
```
Violation → collectViolationMetric() → queueMetric() → metricsQueue[]
```

#### 2. Batching
- Metrics queued in memory (`metricsQueue`)
- Flushed every 30 seconds (configurable via `flushInterval`)
- Flushed immediately when batch size reaches 10 (configurable via `batchSize`)
- Queue size limited to 100 items (drops oldest if exceeded)

#### 3. Sending
```
flush() → httpClient.sendMetricsBatch() → Backend API
         ↓ (on failure)
         addToOfflineQueue() → offlineQueue[] → persist to global state
```

#### 4. Offline Queue
- Persisted to VS Code global state (survives restarts)
- Maximum 100 metrics (drops oldest if exceeded)
- Each metric tracks retry count and last attempt time

#### 5. Retry Logic (Exponential Backoff)
```
Retry Intervals:
- Attempt 1: 5 minutes
- Attempt 2: 10 minutes
- Attempt 3: 20 minutes
- Attempt 4: 60 minutes
- After 4 attempts: Drop metric
```

### Offline Queue Processing
1. Check if queue is empty (return if empty)
2. For each queued metric:
   - Calculate time since last attempt
   - If retry interval elapsed, add to retry batch
   - Otherwise, keep in queue
3. Send retry batch in groups of 10
4. On success: Remove from queue
5. On failure: Increment retry count, update last attempt time
6. Drop metrics after 4 failed attempts
7. Persist updated queue to global state

### Anonymization
- Developer ID: Hashed using crypto (SHA-256)
- Project ID: Generated from workspace path hash
- Team Name: Detected from Git config or manual setting
- No source code collected (only metadata)

### Configuration
```typescript
interface MetricsConfig {
  apiUrl: string;           // Backend API endpoint
  apiKey: string;           // API key for authentication
  batchSize: number;        // Metrics per batch (default: 10)
  flushInterval: number;    // Flush interval in ms (default: 30000)
  retryAttempts: number;    // Max retry attempts (default: 3)
  enabled: boolean;         // Enable/disable collection (default: true)
}
```

### Privacy Considerations
- All developer IDs are hashed before sending
- Only metadata collected (hook IDs, file types, severities)
- No source code or file contents sent
- Users can opt-out via `enableMetrics` setting
- Offline queue cleared on opt-out



## 4. AnalyticsService (KiroAnalyticsService)

### Responsibility
Parses Kiro IDE log files and calculates comprehensive productivity metrics and insights.

### Key Features
- Parses chat files from Kiro logs directory
- Filters system prompts from human message counts
- Calculates interaction metrics
- Estimates tool usage distribution
- Analyzes time patterns (hourly, daily, weekly)
- Tracks workspace activity
- Caches results for performance

### Interface
```typescript
class KiroAnalyticsService {
  constructor()
  
  // Analytics retrieval
  async getAnalytics(forceRefresh: boolean = false): Promise<AnalyticsSummary>
  clearCache(): void
  
  // Internal parsing
  private async collectChatFiles(): Promise<ChatFileData[]>
  private async analyzeChatFile(filePath: string, session: string, file: string): Promise<ChatFileData | null>
  private isSystemPrompt(content: any): boolean
  
  // Metric calculations
  private calculateMessageCounts(chatFiles: ChatFileData[]): MessageCounts
  private calculateInteractionMetrics(chatFiles: ChatFileData[]): InteractionMetrics
  private calculateToolUsage(chatFiles: ChatFileData[]): ToolUsageStats
  private async calculateWorkspaceActivity(): Promise<WorkspaceActivity>
  private calculateTimePatterns(chatFiles: ChatFileData[]): TimePattern
  private calculateSessionMetrics(chatFiles: ChatFileData[]): SessionMetrics
}
```

### Log File Structure
```
~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent/
├── [session-id-1]/
│   ├── chat-file-1.chat
│   ├── chat-file-2.chat
│   └── ...
├── [session-id-2]/
│   └── ...
└── workspace-sessions/
    ├── [base64-encoded-path-1]
    ├── [base64-encoded-path-2]
    └── ...
```

### Chat File Format
```json
{
  "chat": [
    { "role": "human", "content": "..." },
    { "role": "bot", "content": "..." },
    { "role": "tool", "content": "..." }
  ]
}
```

### System Prompt Detection
Messages are filtered as system prompts if content starts with:
- `<identity>`
- `<capabilities>`
- `<response_style>`
- `<rules>`
- `<key_kiro_features>`
- `<system_information>`
- `<platform_specific`
- `<EnvironmentContext>`
- `<kiro-ide-message>`
- `## Included Rules`
- `<user-rule`
- `<workflow-definition>`
- `<implicit-rules>`
- `# System Prompt`
- `CONTEXT TRANSFER:`

### Interaction Calculation
```
Interaction = min(realHumanMessages, botMessages)

Where:
- realHumanMessages = humanMessages - systemPrompts
- Each chat file = 1 session
```

### Session Depth Categories
- **Shallow**: < 50 interactions (quick tasks)
- **Medium**: 50-199 interactions (standard work)
- **Deep**: 200-499 interactions (complex projects)
- **Very Deep**: 500+ interactions (major development)

### Tool Usage Estimation
Currently estimated based on tool message distribution:
- fsWrite: 38.9%
- readFile: 27.5%
- grepSearch: 16.6%
- executeBash: 7.6%
- strReplace: 6.0%
- listDirectory: 3.4%

*Note: Future enhancement will parse actual tool calls from messages*

### Time Pattern Analysis
Calculates:
- **Hourly Activity**: Messages per hour (0-23) with percentages
- **Daily Activity**: Messages per day of week with percentages
- **Weekly Activity**: Messages per date with percentages
- **Peak Hour**: Hour with most activity
- **Peak Day**: Day of week with most activity
- **Working Hours**: 9AM-6PM activity percentage
- **After Hours**: Outside 9AM-6PM activity percentage
- **Top Productive Days**: Top 5 dates by message count

### Workspace Activity Tracking
1. Read base64-encoded paths from `workspace-sessions/` directory
2. Decode paths and clean invalid characters
3. Validate path existence and directory status
4. Exclude common directories (Documents, Desktop, Downloads, etc.)
5. Limit to top 20 workspaces
6. Return workspace name, path, and session count

### Caching Strategy
- Cache TTL: 1 minute (60000ms)
- Cache key: None (single cache for all analytics)
- Cache invalidation: On `forceRefresh` or TTL expiration
- Prevents redundant log parsing on frequent requests

### Performance Considerations
- Skips unreadable session directories
- Skips invalid chat files
- Limits workspace list to 20 items
- Caches results for 1 minute
- Async file operations for non-blocking I/O



## 5. StorageManager Service

### Responsibility
Manages all file system operations and persistent state for the extension.

### Key Features
- Creates and manages `.kiro/` directory structure
- Saves and deletes steering files, hooks, and Kiro hooks
- Validates Kiro hook filenames
- Manages installed pack registry
- Generates and persists developer/project IDs
- Provides workspace and directory path utilities

### Interface
```typescript
class StorageManager {
  constructor(context: ExtensionContext)
  
  // Directory management
  async ensureDirectories(): Promise<void>
  hasWorkspace(): boolean
  getSteeringDir(): string
  getHooksDir(): string
  getKiroHooksDir(): string
  getKiroForgeDir(): string
  
  // File operations - Steering
  async saveSteeringFile(filename: string, content: string): Promise<void>
  async deleteSteeringFile(filename: string): Promise<void>
  
  // File operations - Validation Hooks
  async saveHookFile(filename: string, content: string): Promise<void>
  async deleteHookFile(filename: string): Promise<void>
  async readHookFile(filename: string): Promise<string>
  async listHookFiles(): Promise<string[]>
  
  // File operations - Kiro Hooks
  async saveKiroHook(filename: string, content: string): Promise<void>
  async deleteKiroHook(filename: string): Promise<void>
  isValidKiroHookFilename(filename: string): boolean
  
  // Pack management
  getInstalledPacks(): InstalledPack[]
  async saveInstalledPacks(packs: InstalledPack[]): Promise<void>
  async addInstalledPack(pack: InstalledPack): Promise<void>
  async removeInstalledPack(name: string): Promise<void>
  isPackInstalled(name: string): boolean
  async deletePackDirectory(packName: string): Promise<void>
  
  // State management
  getDeveloperId(): string
  getProjectId(): string
  async getGlobalState<T>(key: string): Promise<T | undefined>
  async setGlobalState(key: string, value: any): Promise<void>
  
  // Cleanup
  async cleanup(): Promise<void>
  async cleanupWorkspaceData(): Promise<void>
}
```

### Directory Structure
```
.kiro/
├── steering/                    # AI guidance files (managed by KiroForge)
│   ├── pack-name-file1.md
│   ├── pack-name-file2.md
│   └── ...
│
├── kiroforge/                   # KiroForge-specific data
│   └── hooks/                   # Validation hooks
│       ├── pack-name-hook1.json
│       ├── pack-name-hook2.json
│       └── ...
│
└── hooks/                       # Kiro IDE Agent Hooks (NOT managed by KiroForge)
    ├── on-save-test.kiro.hook
    ├── format-code.kiro.hook
    └── ...
```

### Kiro Hook Filename Validation
Valid pattern: `xxx-xxx.kiro.hook`
- Must contain at least one hyphen
- Must end with `.kiro.hook` extension
- Examples:
  - ✅ `on-save-test.kiro.hook`
  - ✅ `format-code.kiro.hook`
  - ✅ `my-custom-hook.kiro.hook`
  - ❌ `invalid.kiro.hook` (no hyphen)
  - ❌ `test.json` (wrong extension)

### File Transformation
When installing Kiro hooks:
1. Download `.json` file from S3
2. Rename to `.kiro.hook` extension
3. Validate filename pattern
4. Save to `.kiro/hooks/` directory

This workaround exists because:
- S3 files stored as `.json` (so Lambda serves them as text)
- Kiro IDE expects `.kiro.hook` extension
- Extension renames on save for compatibility

### Installed Pack Registry
Stored in workspace state as JSON:
```typescript
interface InstalledPack {
  name: string;
  version: string;
  installedAt: Date;
  steeringFiles: string[];      // Filenames in .kiro/steering/
  hookFiles: string[];           // Filenames in .kiro/kiroforge/hooks/
  kiroHookFiles?: string[];      // Filenames in .kiro/hooks/
}
```

### Developer ID Generation
1. Check global state for existing ID
2. If not found, generate new UUID
3. Hash UUID using SHA-256
4. Persist to global state
5. Reuse across all workspaces

### Project ID Generation
1. Get workspace folder path
2. Hash path using SHA-256
3. Return hash as project ID
4. Different workspaces = different project IDs

### Cleanup Operations

#### Workspace Cleanup
Removes:
- `.kiro/kiroforge/` directory (validation hooks)
- KiroForge-installed files from `.kiro/steering/`
- All diagnostics from Problems panel

Preserves:
- User-created files in `.kiro/steering/`
- `.kiro/hooks/` (managed by Kiro IDE)

#### Full Cleanup
Removes:
- All steering files
- All validation hooks
- Clears installed pack registry
- Does NOT remove Kiro hooks (separate system)

### Error Handling
- All file operations wrapped in try-catch
- Errors logged to console
- User-friendly error messages shown
- Graceful degradation on failures
- No state corruption on partial failures



## 6. LogParser Service

### Responsibility
Monitors Kiro runtime logs for AI usage metrics (simplified implementation).

### Current Status
This is a **placeholder implementation** demonstrating the concept. Full implementation would require knowledge of Kiro's internal log format and location.

### Interface
```typescript
class LogParser {
  constructor(storageManager: StorageManager)
  
  setMetricsCollector(metricsCollector: MetricsCollector): void
  async startMonitoring(): Promise<void>
  stopMonitoring(): void
  
  // Internal (not implemented)
  private parseLogEntry(entry: string): void
  private async trackSteeringUsage(file: string, operation: string): Promise<void>
}
```

### Intended Functionality
Full implementation would:
1. Locate Kiro runtime log files
2. Set up file watchers for log changes
3. Parse log entries for AI operations
4. Extract steering file references
5. Send usage metrics to MetricsCollector

### Example Log Parsing
```typescript
// Detect AI operations
if (logEntry.includes('code_generation')) {
  await trackSteeringUsage('steering-file.md', 'code_generation', 'log-detected');
}

// Extract steering file references
const steeringMatch = logEntry.match(/steering:(.+\.md)/);
if (steeringMatch) {
  await trackSteeringUsage(steeringMatch[1], 'reference', 'log-detected');
}
```

### Future Enhancements
- Implement actual log file monitoring
- Parse Kiro's log format
- Track steering file usage patterns
- Correlate with code generation events
- Measure steering effectiveness

---

## Service Interactions

### Extension Activation Flow
```
1. Extension Core activates
2. Initialize StorageManager
3. Initialize PackManager (with StorageManager)
4. Initialize MetricsCollector (with StorageManager)
5. Initialize HookRegistry (with StorageManager, MetricsCollector)
6. Initialize LogParser (with StorageManager)
7. Connect LogParser to MetricsCollector
8. Ensure .kiro directories exist
9. Load installed packs (PackManager)
10. Register hooks (HookRegistry)
11. Start log monitoring (LogParser)
12. Validate open documents (HookRegistry)
```

### Pack Installation Flow
```
User → PackManager.showPackInstallationDialog()
     → PackManager.discoverPacks() → HTTP Client → S3
     → User selects packs
     → PackManager.installPack() for each
       → Download manifest → HTTP Client → S3
       → Download files → HTTP Client → S3
       → StorageManager.saveSteeringFile()
       → StorageManager.saveHookFile()
       → StorageManager.saveKiroHook()
       → StorageManager.addInstalledPack()
     → HookRegistry.registerInstalledHooks()
     → Validate open documents
```

### Validation Flow
```
User saves file → HookRegistry.validateDocument()
                → Get applicable hooks
                → For each hook:
                  → Execute with timeout protection
                  → Collect violations
                → Update VS Code diagnostics
                → MetricsCollector.collectViolationMetric() (async)
                  → Queue metric
                  → Batch and send to backend
                  → On failure: Add to offline queue
```

### Analytics Flow
```
User opens Insights → AnalyticsService.getAnalytics()
                    → Check cache (return if valid)
                    → Collect chat files from Kiro logs
                    → Parse each chat file
                    → Filter system prompts
                    → Calculate metrics
                    → Cache results
                    → Return analytics summary
```

### Metrics Flow
```
Violation → MetricsCollector.collectViolationMetric()
          → Queue in memory
          → Flush timer (30s) or batch size (10)
          → HTTP Client → Backend API
          → On success: Clear from queue
          → On failure: Add to offline queue
                      → Persist to global state
                      → Retry with exponential backoff
                      → Drop after 4 attempts
```

---

## Configuration Dependencies

### Required Settings
- `kiroforge.apiUrl`: Backend API endpoint (from CloudFormation)
- `kiroforge.packsUrl`: S3 bucket URL (from CloudFormation)
- `kiroforge.apiKey`: API key (from CloudFormation)

### Optional Settings
- `kiroforge.enableMetrics`: Enable/disable metrics (default: true)
- `kiroforge.enableHooks`: Enable/disable validation (default: true)
- `kiroforge.enableRealtimeValidation`: Real-time validation (default: true)
- `kiroforge.validationDelay`: Debounce delay (default: 500ms)
- `kiroforge.maxFileSizeForValidation`: Line limit (default: 5000)
- `kiroforge.hookTimeout`: Hook timeout (default: 2000ms)
- `kiroforge.teamName`: Manual team name (optional)

### Configuration Hot Reload
When configuration changes:
1. `onDidChangeConfiguration` event fires
2. HTTP Client updates config
3. MetricsCollector updates config
4. Timers restarted if needed
5. No extension restart required

---

## Error Handling Patterns

### Network Errors
- Catch HTTP errors
- Add to offline queue
- Retry with exponential backoff
- Display user-friendly messages
- Continue operation

### File System Errors
- Wrap all FS operations in try-catch
- Log detailed errors
- Show simplified messages to users
- Prevent state corruption
- Graceful degradation

### Validation Errors
- Timeout protection with AbortController
- Skip dangerous patterns
- Log errors without failing
- Continue with remaining hooks
- Isolate failures

### Parsing Errors
- Catch parsing exceptions
- Display fallback UI
- Log errors for debugging
- Don't crash extension
- Return empty/default data

---

## Performance Optimizations

### Startup
- Limit validation to first 5 files
- Async initialization
- Lazy loading of services
- Background pack loading

### Validation
- Throttle to 3 concurrent validations
- Skip large files (>5000 lines)
- Skip long lines (>1000 chars)
- Limit matches per line (50)
- Limit total violations (200)

### Analytics
- Cache results for 1 minute
- Skip unreadable files
- Limit workspace list (20)
- Async file operations

### Metrics
- Batch metrics (10 per request)
- Queue size limit (100)
- Flush interval (30s)
- Fire-and-forget collection

---

## Testing Considerations

### Unit Testing
- Mock VS Code API
- Mock file system operations
- Mock HTTP client
- Test each service in isolation
- Test error paths

### Property-Based Testing
- Generate random inputs
- Verify properties hold
- Test edge cases automatically
- Run 100+ iterations
- Test invariants

### Integration Testing
- Test service interactions
- Test end-to-end flows
- Test with real file system
- Test configuration changes
- Test error recovery

