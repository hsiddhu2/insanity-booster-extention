# Session Counting Fix - Documentation

## Problem Identified

The analytics was counting **workspace folders** as sessions instead of **individual chat files** as sessions.

### Old (Incorrect) Counting
- **19 sessions** (workspace folders with 32-char hash names)
- **5,291 interactions per session** (unrealistic!)
- Each folder contains thousands of chat files spanning multiple days

### New (Correct) Counting
- **8,094 sessions** (individual .chat files)
- **13 interactions per session** (realistic!)
- Each .chat file represents one Kiro IDE session

## Root Cause

The `collectChatFiles()` method was grouping all chat files by their parent folder (workspace), treating each folder as one session. In reality:
- Each **workspace folder** can contain thousands of chat files
- Each **.chat file** represents one actual Kiro IDE session
- Sessions are short-lived (minutes to hours) based on token limits

## The Fix

### What Changes
1. **Session Definition**: 1 chat file = 1 session (not 1 folder = 1 session)
2. **Session Metrics**: Calculate averages based on chat file count
3. **Data Structure**: Track each chat file individually instead of grouping by folder

### Impact on Metrics

#### Before Fix
```
Total Sessions: 19
Avg Interactions/Session: 5,291
Avg Messages/Session: 64,100
```

#### After Fix
```
Total Sessions: 8,094
Avg Interactions/Session: 13
Avg Messages/Session: 153
```

## Implementation Details

### Files to Modify
1. **`extension/src/services/KiroAnalyticsService.ts`**
   - Update `collectChatFiles()` to treat each file as a session
   - Update `calculateSessionMetrics()` to count files, not folders
   - Update `calculateInteractionMetrics()` to use file-based sessions

2. **`extension/src/models/Analytics.ts`**
   - No changes needed (interfaces remain the same)

3. **`extension/src/ui/InsightsTreeProvider.ts`**
   - No changes needed (displays data as-is)

### Key Changes in Analytics Service

#### Old Approach
```typescript
// Group by session folder
const sessions = new Map<string, SessionData>();
chatFiles.forEach(file => {
  if (!sessions.has(file.session)) {
    sessions.set(file.session, { ... });
  }
  // Accumulate data per folder
});
```

#### New Approach
```typescript
// Each chat file is a session
chatFiles.forEach(file => {
  // Treat each file as an independent session
  // No grouping by folder
});
```

### System Prompt Filtering

The fix maintains existing system prompt filtering:
- Filters out: `<identity>`, `<capabilities>`, `<EnvironmentContext>`, etc.
- Only counts REAL user messages
- 108,500 real user prompts (not 143,000 with system prompts)

## Expected Results

### Overview Section
- **Total Sessions**: 8,094 (was 19)
- **Avg Prompts/Session**: 153 (was 64,100)
- **Avg Interactions/Session**: 13 (was 5,291)

### Prompts Section (Time-based)
- **Today**: ~12,881 user prompts
- **Yesterday**: Will show accurate daily breakdown
- **This Week**: Will show accurate weekly breakdown
- **This Month**: Will show accurate monthly breakdown

### Interactions Section
- **Total Interactions**: 108,500
- **Avg Interactions/Session**: 13 (realistic!)
- **Session Depth Categories**: Based on file-level sessions
  - Shallow (< 50): Most sessions
  - Medium (50-199): Some sessions
  - Deep (200-499): Few sessions
  - Very Deep (500+): Rare sessions

## Testing Plan

1. **Run test script**: `node test-corrected-analytics.js`
2. **Verify numbers**: Check that averages are reasonable
3. **Install extension**: Test in VS Code
4. **Review UI**: Check if metrics make sense
5. **User feedback**: Determine if it's clearer or more confusing

## Rollback Plan

If the change is confusing:
1. Revert to folder-based counting
2. OR remove "per session" metrics entirely
3. OR rename "sessions" to "conversations" or "requests"

## Alternative Approaches Considered

### Option 1: Time-Gap Detection
- Detect session boundaries within chat files based on time gaps
- **Problem**: Messages don't have timestamps
- **Status**: Not feasible

### Option 2: Remove Session Metrics
- Focus only on time-based metrics (per day, per week)
- Remove "per session" entirely
- **Status**: Possible fallback if current fix is confusing

### Option 3: Rename "Sessions"
- Call them "conversations" or "requests" instead
- Avoid the term "session" which has IDE-specific meaning
- **Status**: Can be done in addition to fix

## Success Criteria

The fix is successful if:
- ✅ Session counts are realistic (thousands, not tens)
- ✅ Per-session averages are believable (10-20 interactions)
- ✅ Users understand what a "session" represents
- ✅ Metrics help users understand their Kiro usage

## Notes

- **Date Range**: Currently showing 17 days (Nov 4-21, 2025)
- **Power User**: 476 sessions per day is high but reasonable for heavy usage
- **System Prompts**: Already filtered correctly
- **Tool Messages**: Hidden from UI but counted internally

---

**Status**: Ready for implementation  
**Risk Level**: Low (can easily revert)  
**User Impact**: Should make metrics more understandable  
**Next Step**: Implement in analytics service and test
