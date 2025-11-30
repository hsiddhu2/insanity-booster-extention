# Design Document: KiroForge VS Code Extension

## Overview

KiroForge is a comprehensive VS Code extension that enforces organizational code quality standards through real-time validation, provides productivity analytics from Kiro IDE logs, and manages automation workflows via agent hooks. The extension follows a service-oriented architecture with clear separation between UI components, business logic services, and data persistence layers.

### Key Design Principles

1. **Service-Oriented Architecture**: Core functionality is encapsulated in independent services (PackManager, HookRegistry, MetricsCollector, AnalyticsService)
2. **Resilience and Safety**: Timeout protection, error isolation, graceful degradation, and offline queue support
3. **Performance Optimization**: Throttling, caching, batching, and size limits to prevent resource exhaustion
4. **VS Code Integration**: Native tree views, diagnostics, status bar, and webview panels for seamless IDE experience
5. **Extensibility**: Plugin-based pack system allows organizations to distribute custom standards

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      VS Code Extension Host                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Extension Core                         │  │
│  │                  (extension.ts)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │    UI    │    │ Services │    │  Utils   │                 │
│  │ Layer    │    │  Layer   │    │  Layer   │                 │
│  └──────────┘    └──────────┘    └──────────┘                 │
│         │                │                │                     │
│         │                │                │                     │
│  ┌──────▼────────────────▼────────────────▼──────┐            │
│  │           Storage Manager                      │            │
│  │     (File System & State Management)           │            │
│  └────────────────────────────────────────────────┘            │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   External Services    │
              │  - AWS S3 (Packs)      │
              │  - Backend API         │
              │  - Kiro Logs           │
              └────────────────────────┘
```

## Components and Interfaces

### 1. Extension Core (extension.ts)

**Responsibility**: Extension lifecycle management, command registration, event handling

**Key Functions**:
- `activate(context)`: Initialize services, register commands, set up event handlers
- `deactivate()`: Cleanup resources, flush metrics, show uninstall page
- `registerCommands()`: Register all VS Code commands
- `registerEventHandlers()`: Set up file system watchers and document listeners
- `validateOpenDocuments()`: Validate all open files on startup (limited to 5 files)

**Dependencies**: All services, UI providers, storage manager


### 2. Pack Manager Service

**Responsibility**: Steering pack discovery, download, installation, and uninstallation

**Interface**:
```typescript
class PackManager {
  async discoverPacks(): Promise<Pack[]>
  async showPackInstallationDialog(): Promise<number>
  async installPack(pack: Pack): Promise<void>
  async uninstallPack(packName: string): Promise<void>
  async refreshPacks(): Promise<void>
  async loadInstalledPacks(): Promise<void>
  getInstalledPacks(): InstalledPack[]
  getAvailablePacks(): Pack[]
}
```

**Key Behaviors**:
- Fetches pack index from S3 URL configured in settings
- Downloads pack manifests, steering files, validation hooks, and Kiro agent hooks
- Saves files to appropriate directories (`.kiro/steering/`, `.kiro/kiroforge/hooks/`, `.kiro/hooks/`)
- Maintains persistent state of installed packs with timestamps and file lists
- Handles pack updates by comparing versions

### 3. Hook Registry Service

**Responsibility**: Validation hook registration, execution, and diagnostic management

**Interface**:
```typescript
class HookRegistry {
  async registerInstalledHooks(): Promise<void>
  async validateDocument(document: TextDocument): Promise<ValidationResult>
  clearFileDiagnostics(uri: Uri): void
  clearAllDiagnostics(): void
  showIssuesPanel(): Promise<void>
}
```

**Key Behaviors**:
- Registers hooks from all installed packs on startup
- Matches hooks to documents based on file extension and filename patterns
- Executes validation with timeout protection (AbortController)
- Skips dangerous regex patterns (nested quantifiers)
- Throttles concurrent validations to maximum of 3
- Creates VS Code diagnostics for violations
- Collects metrics for violations (fire-and-forget)

**Safety Mechanisms**:
- Configurable timeout (default 500ms) with AbortController
- Skip files exceeding line limit (default 5000 lines)
- Skip lines exceeding 1000 characters
- Limit matches per line (50) and total violations (200)
- Validation queue to prevent concurrent overload

### 4. Metrics Collector Service

**Responsibility**: Collect and send anonymized usage metrics with offline support

**Interface**:
```typescript
class MetricsCollector {
  async collectViolationMetric(violation: Violation): Promise<void>
  async collectSteeringUsageMetric(file: string, operation: string, context: string): Promise<void>
  async collectPackInstallMetric(name: string, version: string, time: number, success: boolean): Promise<void>
  async flush(): Promise<void>
  getOfflineQueueStatus(): { size: number; isOnline: boolean }
  async retryOfflineQueue(): Promise<void>
}
```

**Key Behaviors**:
- Queues metrics in memory with size limit (100 items)
- Batches metrics (10 per request) and flushes every 30 seconds
- Persists offline queue to global state (survives restarts)
- Retries failed sends with exponential backoff (5min, 10min, 20min, 60min)
- Drops metrics after 4 retry attempts
- Anonymizes developer IDs using hashing

### 5. Analytics Service

**Responsibility**: Parse Kiro IDE logs and calculate productivity metrics

**Interface**:
```typescript
class KiroAnalyticsService {
  async getAnalytics(forceRefresh: boolean): Promise<AnalyticsSummary>
  clearCache(): void
}
```

**Key Behaviors**:
- Parses chat files from `~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
- Filters system prompts to calculate real human message counts
- Calculates interactions as min(humanMessages, botMessages) per chat file
- Estimates tool usage distribution from tool message counts
- Calculates hourly, daily, and weekly activity patterns with peak identification
- Decodes base64-encoded workspace paths and validates existence
- Caches results for 1 minute to avoid redundant parsing

### 6. Storage Manager

**Responsibility**: File system operations and persistent state management

**Interface**:
```typescript
class StorageManager {
  async ensureDirectories(): Promise<void>
  async saveSteeringFile(filename: string, content: string): Promise<void>
  async saveHookFile(filename: string, content: string): Promise<void>
  async saveKiroHook(filename: string, content: string): Promise<void>
  async deleteSteeringFile(filename: string): Promise<void>
  async deleteHookFile(filename: string): Promise<void>
  async deleteKiroHook(filename: string): Promise<void>
  async readHookFile(filename: string): Promise<string>
  async listHookFiles(): Promise<string[]>
  getInstalledPacks(): InstalledPack[]
  async saveInstalledPacks(packs: InstalledPack[]): Promise<void>
  async addInstalledPack(pack: InstalledPack): Promise<void>
  async removeInstalledPack(name: string): Promise<void>
  isPackInstalled(name: string): boolean
  getDeveloperId(): string
  getProjectId(): string
}
```

**Key Behaviors**:
- Creates `.kiro/steering/`, `.kiro/kiroforge/hooks/`, `.kiro/hooks/` directories
- Validates Kiro hook filenames (pattern: `xxx-xxx.kiro.hook`)
- Renames `.json` files to `.kiro.hook` for Kiro IDE compatibility
- Persists installed pack registry in workspace state
- Generates and persists developer ID (global) and project ID (workspace)

## Data Models

### Pack Models

```typescript
interface Pack {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  installed?: boolean;
}

interface PackManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  steeringFiles: SteeringFile[];
  hooks: HookFile[];
  kiroHooks?: KiroHookFile[];
}

interface InstalledPack {
  name: string;
  version: string;
  installedAt: Date;
  steeringFiles: string[];
  hookFiles: string[];
  kiroHookFiles?: string[];
}
```

### Hook Models

```typescript
interface Hook {
  id: string;
  name: string;
  description: string;
  trigger: 'onFileSave' | 'onCodeGeneration' | 'onCommit';
  fileTypes: string[];
  validation: ValidationRule;
  severity: 'error' | 'warning' | 'info';
  autoFix: boolean;
  tags: string[];
}

interface ValidationRule {
  type: 'regex' | 'filename' | 'ast' | 'filesize';
  pattern?: string;
  message: string;
  maxSize?: number;
}

interface Violation {
  hookId: string;
  message: string;
  severity: string;
  line: number;
  column: number;
  filePath: string;
  ruleType: string;
  timestamp: Date;
}
```

### Analytics Models

```typescript
interface AnalyticsSummary {
  messages: MessageCounts;
  interactions: InteractionMetrics;
  tools: ToolUsageStats;
  workspaces: WorkspaceActivity;
  timePatterns: TimePattern;
  sessions: SessionMetrics;
  lastUpdated: Date;
}

interface InteractionMetrics {
  totalInteractions: number;
  avgInteractionsPerSession: number;
  avgMessagesPerInteraction: number;
  deepestSession: { id: string; interactions: number; messages: number };
  sessionDepthCategories: {
    shallow: number;    // < 50 interactions
    medium: number;     // 50-199 interactions
    deep: number;       // 200-499 interactions
    veryDeep: number;   // 500+ interactions
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pack Installation Completeness
*For any* pack selected for installation, all file types (steering files, validation hooks, Kiro agent hooks) specified in the manifest should be downloaded and saved to their respective directories.
**Validates: Requirements 1.3, 1.4**

### Property 2: Hook Matching Correctness
*For any* document and registered hooks, only hooks whose fileTypes array contains the document's extension or '*' should be executed during validation.
**Validates: Requirements 2.2**

### Property 3: Diagnostic Structure Completeness
*For any* validation violation, the created diagnostic should contain all required fields: severity, message, line, column, and source "KiroForge".
**Validates: Requirements 2.3**

### Property 4: Diagnostic Cleanup on File Operations
*For any* file that is deleted or renamed, all diagnostics associated with the old file path should be cleared from the Problems panel.
**Validates: Requirements 2.5**

### Property 5: Timeout Enforcement
*For any* validation hook execution, if the execution time exceeds the configured timeout, the system should abort using AbortController without failing the overall validation.
**Validates: Requirements 3.1, 3.2**

### Property 6: File Size Limit Enforcement
*For any* document exceeding the configured line limit (default 5000), validation should be skipped and return an empty violations array.
**Validates: Requirements 3.4**

### Property 7: Concurrent Validation Throttling
*For any* set of concurrent validation requests, no more than 3 validations should execute simultaneously, with additional requests queued.
**Validates: Requirements 3.5**

### Property 8: Metric Structure Completeness
*For any* validation violation, the queued metric should contain all required fields: hookId, severity, file type, anonymized developer ID, and timestamp.
**Validates: Requirements 4.1**

### Property 9: Metric Batching Behavior
*For any* sequence of queued metrics, they should be sent when either 30 seconds elapse or the batch size reaches 10, whichever occurs first.
**Validates: Requirements 4.2**

### Property 10: Offline Queue Persistence
*For any* failed metric send attempt, the metrics should be added to the persistent offline queue and survive extension restarts.
**Validates: Requirements 4.3**

### Property 11: Exponential Backoff Retry
*For any* metric in the offline queue, retry attempts should follow the exponential backoff schedule: 5min, 10min, 20min, 60min, with metrics dropped after 4 attempts.
**Validates: Requirements 4.4**

### Property 12: Queue Size Limit
*For any* metrics queue (in-memory or offline), when the size exceeds 100 items, the oldest metrics should be dropped to prevent unbounded growth.
**Validates: Requirements 4.5, 13.4**

### Property 13: System Prompt Filtering
*For any* chat file message with content starting with system tags (`<identity>`, `<capabilities>`, `<rules>`, etc.), it should be excluded from human message counts.
**Validates: Requirements 5.2**

### Property 14: Interaction Calculation Formula
*For any* chat file, the interaction count should equal min(humanMessages, botMessages) where humanMessages excludes system prompts.
**Validates: Requirements 5.3**

### Property 15: Activity Percentage Summation
*For any* time pattern calculation (hourly, daily, weekly), the sum of all activity percentages should equal 100% (within floating point tolerance).
**Validates: Requirements 5.5**

### Property 16: Kiro Hook Filename Transformation
*For any* Kiro hook file downloaded with `.json` extension, it should be renamed to `.kiro.hook` extension when saved locally.
**Validates: Requirements 6.1**

### Property 17: Kiro Hook Filename Validation
*For any* Kiro hook filename, it should match the pattern `xxx-xxx.kiro.hook` with at least one hyphen, or be rejected.
**Validates: Requirements 6.2**

### Property 18: Pack Uninstallation Completeness
*For any* pack being uninstalled, all associated files (steering files, validation hooks, Kiro hooks) should be deleted from their respective directories.
**Validates: Requirements 7.1**

### Property 19: Diagnostic Cleanup on Uninstall
*For any* pack uninstallation, all diagnostics from that pack's hooks should be cleared from the Problems panel.
**Validates: Requirements 7.2**

### Property 20: Configuration Hot Reload
*For any* configuration change to `kiroforge.*` settings, the HTTP client, metrics collector, and hook registry should update their configuration without requiring extension restart.
**Validates: Requirements 8.2**

### Property 21: Metrics Toggle Immediate Effect
*For any* change to the `enableMetrics` setting, metrics collection should start or stop immediately without delay.
**Validates: Requirements 8.4**

### Property 22: Validation Delay Application
*For any* change to the `validationDelay` setting, the new debounce timeout should apply to subsequent real-time validations.
**Validates: Requirements 8.5**

### Property 23: Tree View Structure Consistency
*For any* installed pack in the Approved Steering view, it should display as a parent node with steering files as children.
**Validates: Requirements 9.2**

### Property 24: Hook Grouping by Pack
*For any* validation hooks in the Quality Skills view, they should be grouped under their parent pack with file type information displayed.
**Validates: Requirements 9.3**

### Property 25: Analytics Section Completeness
*For any* Kiro Insights view load, all five sections (overview, interactions, tools, activity, workspaces) should be present as collapsible tree items.
**Validates: Requirements 9.4**

### Property 26: Workspace Path Validation
*For any* workspace clicked in insights, the system should validate the path exists before prompting to open, showing a warning for non-existent paths.
**Validates: Requirements 9.5**

### Property 27: Status Bar Tooltip Completeness
*For any* analytics data loaded, the status bar tooltip should contain interaction count, chat count, and peak hour information.
**Validates: Requirements 10.2**

### Property 28: Analytics Export JSON Structure
*For any* analytics export, the JSON file should contain all analytics sections with proper structure and be valid JSON.
**Validates: Requirements 10.4**

### Property 29: Cache Invalidation on Refresh
*For any* "Refresh Data" action, the analytics cache should be cleared and data reloaded from log files.
**Validates: Requirements 10.5**

### Property 30: Empty State CTA Display
*For any* tree view with no installed packs, an "Install Packs" call-to-action button should be displayed.
**Validates: Requirements 11.3**

### Property 31: Uninstall Data Cleanup
*For any* "Remove Data" action during uninstall, all files in `.kiro/kiroforge/` should be deleted.
**Validates: Requirements 11.5**

### Property 32: Pack Installation Failure State
*For any* pack download failure, the pack should not be registered as installed in persistent storage.
**Validates: Requirements 12.1**

### Property 33: Hook Execution Error Isolation
*For any* validation hook that throws an error, the error should be logged and remaining hooks should continue executing.
**Validates: Requirements 12.2**

### Property 34: Analytics Parsing Error Handling
*For any* analytics parsing failure, the system should display "No analytics data available" without crashing the extension.
**Validates: Requirements 12.3**

### Property 35: File System Error Handling
*For any* file system operation failure, the system should catch the exception and display a user-friendly error message.
**Validates: Requirements 12.4**

### Property 36: API Error Offline Queueing
*For any* backend API error response, the failed metrics should be added to the offline queue with retry logic.
**Validates: Requirements 12.5**

### Property 37: Startup Validation Limit
*For any* extension activation with open documents, validation should be limited to the first 5 files to prevent memory exhaustion.
**Validates: Requirements 13.1**

### Property 38: Analytics Cache TTL
*For any* analytics request within 1 minute of the previous request, cached data should be returned without re-parsing log files.
**Validates: Requirements 13.2**

### Property 39: Metrics Batch Size Limit
*For any* metrics send operation, the batch should contain at most 10 metrics per HTTP request.
**Validates: Requirements 13.3**

### Property 40: Regex Line Length Limit
*For any* line exceeding 1000 characters during regex validation, the line should be skipped with a warning logged.
**Validates: Requirements 13.5**

### Property 41: Team Name Configuration Precedence
*For any* metrics collection with both configured team name and Git-detected team name, the configured value should be used.
**Validates: Requirements 14.2**

### Property 42: Metrics Without Team Tag
*For any* metrics collection when team name cannot be detected and is not configured, metrics should be sent without a team tag.
**Validates: Requirements 14.3**

### Property 43: Developer ID Persistence
*For any* developer ID generation, the hashed identifier should be persisted globally and reused across workspaces.
**Validates: Requirements 14.4**

### Property 44: Project ID Workspace Specificity
*For any* two different workspaces, they should generate different project IDs based on their workspace paths.
**Validates: Requirements 14.5**

### Property 45: Workspace Path Decoding
*For any* base64-encoded workspace path, it should be decoded correctly and invalid characters should be cleaned.
**Validates: Requirements 15.1, 15.2**

### Property 46: Workspace Directory Exclusion
*For any* workspace list, common directories (Documents, Desktop, Downloads, Pictures, Music, Videos, Library) should be excluded.
**Validates: Requirements 15.3**

### Property 47: Workspace Path Error Handling
*For any* invalid workspace path during decoding, it should be skipped without failing the entire workspace list calculation.
**Validates: Requirements 15.4**

### Property 48: Workspace List Size Limit
*For any* workspace list exceeding 20 items, only the first 20 should be displayed in the tree view.
**Validates: Requirements 15.5**


## Error Handling

### Error Categories and Strategies

#### 1. Network Errors (S3, Backend API)
- **Strategy**: Graceful degradation with offline queue
- **Implementation**: 
  - Catch HTTP errors and add to offline queue
  - Retry with exponential backoff
  - Display user-friendly messages
  - Continue operation without blocking

#### 2. File System Errors
- **Strategy**: Catch and report with user-friendly messages
- **Implementation**:
  - Wrap all FS operations in try-catch
  - Log detailed errors for debugging
  - Show simplified messages to users
  - Prevent state corruption

#### 3. Validation Errors
- **Strategy**: Isolate failures and continue
- **Implementation**:
  - Timeout protection with AbortController
  - Skip dangerous patterns
  - Log errors without failing validation
  - Continue with remaining hooks

#### 4. Parsing Errors (Analytics)
- **Strategy**: Graceful degradation with fallback UI
- **Implementation**:
  - Catch parsing exceptions
  - Display "No data available" message
  - Log errors for debugging
  - Don't crash extension

#### 5. Configuration Errors
- **Strategy**: Use defaults and warn users
- **Implementation**:
  - Validate configuration on load
  - Use sensible defaults for missing values
  - Show warnings for invalid config
  - Allow operation with partial config

### Error Recovery Mechanisms

1. **Offline Queue**: Persists failed metrics and retries automatically
2. **Timeout Protection**: Aborts long-running operations to prevent hangs
3. **Throttling**: Limits concurrent operations to prevent resource exhaustion
4. **Size Limits**: Caps queues and lists to prevent memory issues
5. **Validation**: Checks inputs before processing to fail fast

## Testing Strategy

### Unit Testing

**Framework**: Jest or Mocha with TypeScript support

**Test Coverage Areas**:
1. **Service Logic**: Test each service method in isolation with mocked dependencies
2. **Data Transformations**: Test model conversions, calculations, and formatting
3. **Validation Rules**: Test hook matching, pattern validation, and diagnostic creation
4. **Error Handling**: Test error paths and recovery mechanisms
5. **Configuration**: Test config loading, validation, and hot reload

**Example Unit Tests**:
- `PackManager.installPack()` with mocked HTTP client
- `HookRegistry.validateDocument()` with sample documents and hooks
- `MetricsCollector.flush()` with mocked API responses
- `AnalyticsService.calculateInteractionMetrics()` with sample chat data
- `StorageManager.isValidKiroHookFilename()` with various filenames

### Property-Based Testing

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure statistical confidence in correctness.

**Test Tagging**: Each property-based test must include a comment with the format:
```typescript
// Feature: kiroforge-deep-dive, Property X: [property description]
```

**Property Test Coverage**:
- Properties 1-48 as defined in the Correctness Properties section
- Each property should be implemented as a separate test case
- Tests should generate random inputs within valid ranges
- Tests should verify the property holds for all generated inputs

**Example Property Tests**:

```typescript
// Feature: kiroforge-deep-dive, Property 1: Pack Installation Completeness
test('all pack files are downloaded and saved', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string(),
        version: fc.string(),
        steeringFiles: fc.array(fc.string()),
        hookFiles: fc.array(fc.string()),
        kiroHookFiles: fc.array(fc.string())
      }),
      async (packManifest) => {
        // Install pack and verify all files exist in correct directories
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: kiroforge-deep-dive, Property 14: Interaction Calculation Formula
test('interaction count equals min(human, bot) messages', () => {
  fc.assert(
    fc.property(
      fc.record({
        humanMessages: fc.nat(),
        botMessages: fc.nat(),
        toolMessages: fc.nat()
      }),
      (chatFile) => {
        const interactions = Math.min(chatFile.humanMessages, chatFile.botMessages);
        // Verify calculation matches expected formula
        return interactions === Math.min(chatFile.humanMessages, chatFile.botMessages);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Test Scenarios**:
1. **End-to-End Pack Installation**: Install pack, verify files, validate documents, check diagnostics
2. **Metrics Flow**: Trigger violations, verify metrics queued, sent, and offline queue behavior
3. **Analytics Pipeline**: Create mock log files, parse, verify calculations
4. **UI Interactions**: Test tree view updates, command execution, webview rendering
5. **Configuration Changes**: Modify settings, verify services update correctly

### Performance Testing

**Test Scenarios**:
1. **Validation Performance**: Measure validation time for files of varying sizes
2. **Concurrent Validation**: Test throttling with many simultaneous validations
3. **Memory Usage**: Monitor memory during large file validation and analytics parsing
4. **Startup Time**: Measure extension activation time with various numbers of installed packs
5. **Offline Queue**: Test queue performance with large numbers of queued metrics

**Performance Targets**:
- Validation: < 500ms for files under 5000 lines
- Analytics parsing: < 2 seconds for typical log directory
- Extension activation: < 1 second with 10 installed packs
- Memory usage: < 100MB during normal operation

### Manual Testing Checklist

1. **Pack Management**:
   - [ ] Install pack from dialog
   - [ ] Verify files appear in tree views
   - [ ] Uninstall pack and verify cleanup
   - [ ] Check for orphaned hooks

2. **Validation**:
   - [ ] Save file and see diagnostics
   - [ ] Fix violation and verify diagnostic clears
   - [ ] Test with large files (> 5000 lines)
   - [ ] Test with complex regex patterns

3. **Analytics**:
   - [ ] View insights in tree view
   - [ ] Check status bar tooltip
   - [ ] Export analytics to JSON
   - [ ] Click workspace to open

4. **Metrics**:
   - [ ] Trigger violations and check metrics sent
   - [ ] Disconnect network and verify offline queue
   - [ ] Reconnect and verify retry
   - [ ] Check metrics status command

5. **Configuration**:
   - [ ] Change settings and verify hot reload
   - [ ] Test with missing API URL
   - [ ] Toggle metrics collection
   - [ ] Adjust validation delay

## Deployment and Distribution

### Extension Packaging

**Build Process**:
1. Compile TypeScript to JavaScript using webpack
2. Bundle all dependencies into `dist/extension.js`
3. Package using `vsce package` to create `.vsix` file
4. Version follows semantic versioning (MAJOR.MINOR.PATCH)

**Package Contents**:
- Compiled extension code (`dist/extension.js`)
- Package manifest (`package.json`)
- README and documentation
- Icon and resources
- License file

### Installation Methods

1. **From VSIX**: Users download `.vsix` and install via VS Code Extensions view
2. **From Marketplace**: (Future) Publish to VS Code Marketplace for automatic updates
3. **From Source**: Developers can clone repo, run `npm install`, and `npm run compile`

### Configuration Requirements

**Required Settings** (from CloudFormation outputs):
- `kiroforge.apiUrl`: Backend API endpoint
- `kiroforge.packsUrl`: S3 bucket URL for packs
- `kiroforge.apiKey`: API key for authentication

**Optional Settings**:
- `kiroforge.enableMetrics`: Enable/disable metrics collection
- `kiroforge.enableHooks`: Enable/disable validation
- `kiroforge.validationDelay`: Debounce delay for real-time validation
- `kiroforge.maxFileSizeForValidation`: Line limit for validation
- `kiroforge.hookTimeout`: Timeout for hook execution
- `kiroforge.teamName`: Manual team name override

### Backend Dependencies

**AWS Services Required**:
1. **S3 Bucket**: Stores steering packs with public read access
2. **API Gateway**: REST API for metrics collection
3. **Lambda Functions**: Process and store metrics
4. **DynamoDB**: Store metrics data for analytics

**Pack Structure in S3**:
```
s3://bucket/
├── index.json                    # Pack registry
└── packs/
    └── pack-name/
        └── 1.0.0/
            ├── manifest.json     # Pack manifest
            ├── steering/         # Steering files
            ├── hooks/            # Validation hooks
            └── kiro-hooks/       # Kiro agent hooks
```

## Security Considerations

### Data Privacy

1. **Anonymization**: Developer IDs are hashed before sending
2. **No Source Code**: Only metadata (file types, hook IDs) is collected
3. **Opt-Out**: Users can disable metrics collection in settings
4. **Local Storage**: Sensitive data stays on user's machine

### API Security

1. **Authentication**: API key required for all backend requests
2. **HTTPS**: All network communication uses TLS
3. **Rate Limiting**: Backend enforces rate limits to prevent abuse
4. **Input Validation**: All inputs validated before processing

### File System Security

1. **Workspace Isolation**: Extension only accesses `.kiro/` directory
2. **Path Validation**: All file paths validated before operations
3. **Permission Checks**: Verify write permissions before file operations
4. **No Arbitrary Execution**: Validation hooks are declarative, not executable code

## Future Enhancements

### Planned Features

1. **AST Validation**: Support for abstract syntax tree-based validation rules
2. **Auto-Fix**: Automatic fixes for common violations
3. **Custom Hooks**: Allow users to create custom validation hooks
4. **Team Dashboard**: Web dashboard for team-wide analytics
5. **Pack Marketplace**: Community-contributed steering packs
6. **Real-Time Collaboration**: Share insights with team members
7. **AI-Powered Suggestions**: Use AI to suggest code improvements
8. **Git Integration**: Track metrics per commit/branch
9. **CI/CD Integration**: Run validation in CI pipelines
10. **Multi-Language Support**: Extend beyond TypeScript/JavaScript

### Technical Debt

1. **Log Parser**: Currently simplified, needs full Kiro log format support
2. **Tool Usage**: Currently estimated, needs actual tool call parsing
3. **Test Coverage**: Need comprehensive unit and integration tests
4. **Performance**: Optimize analytics parsing for large log directories
5. **Error Messages**: Improve user-facing error messages with actionable guidance

