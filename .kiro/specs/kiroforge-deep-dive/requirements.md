# Requirements Document: KiroForge VS Code Extension

## Introduction

KiroForge is a comprehensive VS Code extension designed to enforce organizational code quality standards, automate workflows through agent hooks, and provide productivity insights for development teams using Kiro IDE. The extension integrates with AWS backend services for metrics collection and steering pack distribution, while providing real-time code validation and analytics directly within the IDE.

## Glossary

- **Steering Pack**: A collection of AI guidance files (markdown), validation hooks (JSON), and Kiro agent hooks that define organizational coding standards and automation workflows
- **Validation Hook**: A JSON-defined rule that validates code against patterns (regex, filename, filesize, AST) and reports violations to the Problems panel
- **Kiro Agent Hook**: An automation trigger (`.kiro.hook` file) that executes on IDE events (file save, message send, session start, agent complete)
- **Quality Skill**: User-facing term for validation hooks that enforce code quality standards
- **Approved Steering**: User-facing term for steering packs that contain organizational standards
- **Kiro Insights**: Analytics dashboard showing productivity metrics derived from Kiro IDE log files
- **Metrics Collector**: Service that collects and sends anonymized usage metrics to backend API with offline queue support
- **Pack Manager**: Service responsible for discovering, downloading, installing, and uninstalling steering packs from S3
- **Hook Registry**: Service that registers validation hooks and executes them against documents with timeout protection
- **Analytics Service**: Service that parses Kiro IDE logs and calculates productivity metrics
- **Offline Queue**: Persistent storage for metrics that failed to send, with exponential backoff retry logic
- **Diagnostic Collection**: VS Code's Problems panel integration for displaying validation violations
- **Tree Provider**: VS Code UI component that displays hierarchical data in the sidebar
- **Storage Manager**: Service managing file system operations and persistent state in `.kiro/` directory

## Requirements

### Requirement 1: Pack Discovery and Installation

**User Story:** As a developer, I want to discover and install approved steering packs from a centralized registry, so that I can enforce organizational standards in my workspace.

#### Acceptance Criteria

1. WHEN the extension activates THEN the system SHALL fetch the pack index from the configured S3 URL
2. WHEN a user opens the pack installation dialog THEN the system SHALL display all available packs with name, version, and description
3. WHEN a user selects packs to install THEN the system SHALL download the manifest, steering files, validation hooks, and Kiro agent hooks for each pack
4. WHEN pack files are downloaded THEN the system SHALL save steering files to `.kiro/steering/`, validation hooks to `.kiro/kiroforge/hooks/`, and Kiro agent hooks to `.kiro/hooks/`
5. WHEN a pack is installed THEN the system SHALL register the pack in persistent storage with installation timestamp and file lists

### Requirement 2: Real-Time Code Validation

**User Story:** As a developer, I want my code to be validated against organizational standards as I work, so that I can catch violations early and maintain code quality.

#### Acceptance Criteria

1. WHEN a file is saved THEN the system SHALL execute all applicable validation hooks against the document
2. WHEN validation hooks execute THEN the system SHALL match hooks based on file extension and filename patterns
3. WHEN a validation hook matches a pattern THEN the system SHALL create a diagnostic entry with severity, message, line, and column
4. WHEN diagnostics are created THEN the system SHALL display them in the VS Code Problems panel with source "KiroForge"
5. WHEN a file is deleted or renamed THEN the system SHALL clear diagnostics for the old file path

### Requirement 3: Hook Execution Safety

**User Story:** As a developer, I want validation hooks to execute safely without blocking my IDE, so that I can maintain productivity even with complex validation rules.

#### Acceptance Criteria

1. WHEN a validation hook executes THEN the system SHALL enforce a configurable timeout (default 500ms) using AbortController
2. WHEN a hook exceeds the timeout THEN the system SHALL abort execution and log a warning without failing validation
3. WHEN processing regex patterns THEN the system SHALL skip patterns with nested quantifiers to prevent catastrophic backtracking
4. WHEN validating large files THEN the system SHALL skip files exceeding the configured line limit (default 5000 lines)
5. WHEN multiple validations run concurrently THEN the system SHALL throttle to a maximum of 3 concurrent validations

### Requirement 4: Metrics Collection and Offline Support

**User Story:** As a team lead, I want to collect anonymized usage metrics from my team, so that I can track code quality trends and compliance with organizational standards.

#### Acceptance Criteria

1. WHEN a validation violation occurs THEN the system SHALL queue a metric with hook ID, severity, file type, and anonymized developer ID
2. WHEN metrics are queued THEN the system SHALL batch send them every 30 seconds or when batch size reaches 10
3. WHEN the backend API is unavailable THEN the system SHALL add failed metrics to a persistent offline queue
4. WHEN metrics are in the offline queue THEN the system SHALL retry with exponential backoff (5min, 10min, 20min, 60min)
5. WHEN the offline queue exceeds 100 metrics THEN the system SHALL drop the oldest metrics to prevent memory exhaustion

### Requirement 5: Kiro Insights Analytics

**User Story:** As a developer, I want to see analytics about my Kiro IDE usage, so that I can understand my productivity patterns and optimize my workflow.

#### Acceptance Criteria

1. WHEN the insights view loads THEN the system SHALL parse all chat files from `~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
2. WHEN parsing chat files THEN the system SHALL filter out system prompts to calculate real human message counts
3. WHEN calculating interactions THEN the system SHALL define an interaction as min(humanMessages, botMessages) per chat file
4. WHEN displaying tool usage THEN the system SHALL estimate tool distribution based on tool message counts
5. WHEN showing time patterns THEN the system SHALL calculate hourly, daily, and weekly activity percentages with peak identification

### Requirement 6: Kiro Agent Hooks Management

**User Story:** As a developer, I want to manage Kiro IDE agent hooks through the extension, so that I can automate workflows based on IDE events.

#### Acceptance Criteria

1. WHEN a pack with Kiro hooks is installed THEN the system SHALL download `.json` files and rename them to `.kiro.hook` extension
2. WHEN saving Kiro hooks THEN the system SHALL validate filenames match the pattern `xxx-xxx.kiro.hook` with at least one hyphen
3. WHEN the Kiro Hooks tree view loads THEN the system SHALL list all `.kiro.hook` files from `.kiro/hooks/` directory
4. WHEN a user clicks a Kiro hook THEN the system SHALL open the file in the editor for viewing and editing
5. WHEN a pack is uninstalled THEN the system SHALL delete all associated Kiro hook files from `.kiro/hooks/`

### Requirement 7: Pack Uninstallation and Cleanup

**User Story:** As a developer, I want to cleanly uninstall packs and remove workspace data, so that I can manage my workspace without leaving orphaned files.

#### Acceptance Criteria

1. WHEN a user uninstalls a pack THEN the system SHALL delete all steering files, validation hooks, and Kiro hooks associated with that pack
2. WHEN files are deleted THEN the system SHALL clear all diagnostics from the Problems panel
3. WHEN the workspace cleanup command runs THEN the system SHALL remove the entire `.kiro/kiroforge/` directory
4. WHEN orphaned hooks are detected (hooks without packs) THEN the system SHALL prompt the user to clean them up
5. WHEN the extension deactivates THEN the system SHALL show an uninstall page if workspace data exists

### Requirement 8: Configuration Management

**User Story:** As a developer, I want to configure the extension through VS Code settings, so that I can customize behavior for my workflow and organization.

#### Acceptance Criteria

1. WHEN the extension activates THEN the system SHALL load configuration from `kiroforge.*` settings
2. WHEN configuration changes THEN the system SHALL update HTTP client, metrics collector, and hook registry without restart
3. WHEN API URL is not configured THEN the system SHALL gracefully handle connection failures and queue metrics offline
4. WHEN metrics collection is disabled THEN the system SHALL stop collecting and sending metrics immediately
5. WHEN validation delay is changed THEN the system SHALL apply the new debounce timeout to real-time validation

### Requirement 9: Tree View UI Components

**User Story:** As a developer, I want to view and manage packs, hooks, and insights through sidebar tree views, so that I can easily access extension features.

#### Acceptance Criteria

1. WHEN the extension activates THEN the system SHALL register four tree views: Approved Steering, Quality Skills, Kiro Agent Hooks, and Kiro Insights
2. WHEN the Approved Steering view loads THEN the system SHALL display installed packs with expand/collapse for steering files
3. WHEN the Quality Skills view loads THEN the system SHALL display validation hooks grouped by pack with file type information
4. WHEN the Kiro Insights view loads THEN the system SHALL display analytics with collapsible sections for overview, interactions, tools, activity, and workspaces
5. WHEN a workspace is clicked in insights THEN the system SHALL validate the path exists and prompt to open in new or current window

### Requirement 10: Status Bar Integration

**User Story:** As a developer, I want to see quick insights in the status bar, so that I can monitor my productivity at a glance.

#### Acceptance Criteria

1. WHEN the extension activates THEN the system SHALL create a status bar item with insights icon
2. WHEN analytics are loaded THEN the system SHALL display interaction count, chat count, and peak hour in the status bar tooltip
3. WHEN the status bar item is clicked THEN the system SHALL show a quick pick menu with analytics options
4. WHEN "Export Analytics" is selected THEN the system SHALL prompt for save location and write JSON file
5. WHEN "Refresh Data" is selected THEN the system SHALL clear cache and reload analytics from log files

### Requirement 11: Welcome and Onboarding

**User Story:** As a new user, I want to see a welcome page with setup instructions, so that I can quickly configure and start using the extension.

#### Acceptance Criteria

1. WHEN the extension activates for the first time THEN the system SHALL display a welcome webview panel
2. WHEN the welcome page loads THEN the system SHALL show configuration steps with CloudFormation output references
3. WHEN no packs are installed THEN the system SHALL display "Install Packs" call-to-action buttons in all tree views
4. WHEN the extension deactivates with workspace data THEN the system SHALL show an uninstall page with cleanup instructions
5. WHEN the user chooses "Remove Data" during uninstall THEN the system SHALL delete all KiroForge workspace files

### Requirement 12: Error Handling and Resilience

**User Story:** As a developer, I want the extension to handle errors gracefully, so that failures don't disrupt my workflow or corrupt my workspace.

#### Acceptance Criteria

1. WHEN pack download fails THEN the system SHALL display an error message and not register the pack as installed
2. WHEN validation hook execution fails THEN the system SHALL log the error and continue with remaining hooks
3. WHEN analytics parsing fails THEN the system SHALL display "No analytics data available" without crashing
4. WHEN file system operations fail THEN the system SHALL catch exceptions and show user-friendly error messages
5. WHEN the backend API returns errors THEN the system SHALL queue metrics offline and retry with exponential backoff

### Requirement 13: Performance Optimization

**User Story:** As a developer, I want the extension to perform efficiently, so that it doesn't slow down my IDE or consume excessive resources.

#### Acceptance Criteria

1. WHEN validating open documents on startup THEN the system SHALL limit validation to the first 5 files to prevent memory exhaustion
2. WHEN caching analytics THEN the system SHALL use a 1-minute TTL to avoid redundant log parsing
3. WHEN sending metrics THEN the system SHALL batch up to 10 metrics per request to reduce network overhead
4. WHEN the metrics queue exceeds 100 items THEN the system SHALL drop metrics to prevent unbounded memory growth
5. WHEN regex validation processes lines THEN the system SHALL skip lines exceeding 1000 characters to prevent catastrophic backtracking

### Requirement 14: Team Detection and Identification

**User Story:** As a team lead, I want metrics to be tagged with team information, so that I can aggregate and analyze data by team.

#### Acceptance Criteria

1. WHEN collecting metrics THEN the system SHALL attempt to detect team name from Git configuration
2. WHEN team name is configured in settings THEN the system SHALL use the configured value over auto-detection
3. WHEN team name cannot be detected THEN the system SHALL send metrics without team tag
4. WHEN developer ID is generated THEN the system SHALL create a hashed identifier and persist it globally
5. WHEN project ID is generated THEN the system SHALL create a workspace-specific identifier based on workspace path

### Requirement 15: Workspace Activity Tracking

**User Story:** As a developer, I want to see which Kiro projects I've worked on, so that I can quickly navigate to recent workspaces.

#### Acceptance Criteria

1. WHEN calculating workspace activity THEN the system SHALL read base64-encoded paths from `workspace-sessions` directory
2. WHEN decoding workspace paths THEN the system SHALL clean invalid characters and validate path existence
3. WHEN displaying workspaces THEN the system SHALL exclude common directories (Documents, Desktop, Downloads, Pictures, Music, Videos, Library)
4. WHEN a workspace path is invalid THEN the system SHALL skip it without failing the entire workspace list
5. WHEN workspace list exceeds 20 items THEN the system SHALL limit display to the top 20 workspaces
