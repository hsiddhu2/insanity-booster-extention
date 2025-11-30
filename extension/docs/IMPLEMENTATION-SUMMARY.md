# Analytics Accuracy Implementation Summary

## Changes Being Implemented

### 1. Models Updated (Analytics.ts) ✅
- Renamed `ConversationMetrics` → `InteractionMetrics`
- Renamed `exchanges` → `interactions`
- Renamed `depthCategories` → `sessionDepthCategories`
- Added `realHumanMessages` and `systemPrompts` to SessionData

### 2. Analytics Service (KiroAnalyticsService.ts) - IN PROGRESS
Need to update:
- Add system prompt filtering function
- Update `calculateConversationMetrics` → `calculateInteractionMetrics`
- Use sequential pair tracking for interactions (not min count)
- Filter system prompts from human messages
- Calculate per-session averages

### 3. Tree Provider (InsightsTreeProvider.ts) - PENDING
Need to update:
- Rename all "Conversation" references → "Interactions"
- Update depth categories display
- Show per-session metrics (e.g., "106K (5.6K/session)")
- Update section names and labels

### 4. Status Bar (InsightsStatusBar.ts) ✅
- Changed peak hour display from "🔥 1:00" to "Peak: 1-2h"

## System Prompt Filters
```typescript
const systemTags = [
  '<identity>',
  '<capabilities>',
  '<response_style>',
  '<rules>',
  '<key_kiro_features>',
  '<system_information>',
  '<platform_specific',
  '<EnvironmentContext>',
  '<kiro-ide-message>',
  '## Included Rules',
  '<user-rule',
  '<workflow-definition>',
  '<implicit-rules>',
  '# System Prompt',
  'CONTEXT TRANSFER:'
];
```

## Expected Results
- Real Human Messages: ~106K (filtered from 141K)
- Interactions: ~100K (accurate sequential counting)
- Per-session averages shown throughout UI
- Clearer terminology (Interactions instead of Conversations/Exchanges)
