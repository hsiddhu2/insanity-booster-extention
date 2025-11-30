# Analytics Research Scripts

This directory contains research and testing scripts used during the development of the Kiro Insights analytics feature.

## Purpose

These scripts were used to:
- Analyze Kiro log file structure and content
- Verify analytics calculations and metrics
- Test session counting methodology
- Validate message filtering (system prompts vs user messages)
- Research time patterns and activity metrics

## Script Categories

### Analysis Scripts
- `analyze-chat-files.js` - Analyzes chat file structure
- `analyze-conversation-depth.js` - Studies conversation depth patterns
- `analyze-messages.js` - Message counting and categorization
- `analyze-remaining-metrics.js` - Additional metrics analysis
- `analyze-time-patterns.js` - Time-based activity patterns
- `analyze-workspace-tools.js` - Tool usage analysis

### Verification Scripts
- `verify-human-messages.js` - Validates human message filtering
- `verify-metrics-per-session.js` - Checks per-session metrics
- `verify-session-depth.js` - Validates session depth categorization

### Testing Scripts
- `test-accurate-exchanges.js` - Tests interaction/exchange counting
- `test-corrected-analytics.js` - Tests corrected analytics implementation

### Validation Scripts
- `check-date-range.js` - Validates date range calculations
- `check-file-distribution.js` - Checks file distribution across sessions
- `check-message-timestamps.js` - Validates timestamp handling
- `check-realistic.js` - Checks if metrics are realistic
- `check-session-duration.js` - Validates session duration calculations

### Utility Scripts
- `correct-session-count.js` - Corrects session counting methodology
- `count-real-human-messages.js` - Counts actual user messages (filters system prompts)
- `show-complete-conversation.js` - Displays full conversation structure
- `show-message-structure.js` - Shows message data structure

## Usage

These scripts are standalone Node.js scripts that can be run directly:

```bash
node analyze-messages.js
node verify-human-messages.js
node test-corrected-analytics.js
```

## Note

These scripts were used during development and testing. The final implementation is in:
- `../src/services/KiroAnalyticsService.ts` - Main analytics service
- `../src/ui/InsightsTreeProvider.ts` - Tree view UI
- `../src/ui/InsightsStatusBar.ts` - Status bar integration
- `../src/models/Analytics.ts` - Data models

## Key Findings

1. **Session Counting**: Each chat file = 1 session (not workspace folders)
2. **System Prompt Filtering**: Comprehensive tag detection to filter system prompts
3. **Interaction Calculation**: min(humanMessages, botMessages) per session
4. **Session Depth Categories**: Shallow (<50), Medium (50-199), Deep (200-499), Very Deep (500+)
5. **Realistic Metrics**: ~13 interactions/session, ~153 messages/session, ~476 sessions/day
