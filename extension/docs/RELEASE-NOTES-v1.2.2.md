# KiroForge v1.2.2 Release Notes

## 🎉 Release Summary

Version 1.2.2 brings significant improvements to the analytics accuracy and terminology consistency in the KiroForge extension.

## ✨ New Features

### 1. System Prompt Filtering
- **Accurate Human Message Counting**: Now filters out system prompts that were inflating human message counts
- **Filtered Tags**: 
  - `<identity>`, `<capabilities>`, `<response_style>`, `<rules>`
  - `<key_kiro_features>`, `<system_information>`
  - `<EnvironmentContext>`, `<kiro-ide-message>`
  - `## Included Rules`, `<user-rule>`
  - `<workflow-definition>`, `<implicit-rules>`
  - `# System Prompt`, `CONTEXT TRANSFER:`
- **Result**: Real human messages: ~106K (filtered from 141K total)

### 2. Accurate Interaction Counting
- Renamed "Conversations" → "Interactions" for clarity
- Improved counting algorithm using sequential pair tracking
- Total interactions: ~100K (accurate count)
- Per-session average: 5,291 interactions/session

### 3. Consistent Terminology
- **UI Updates**: All references to "Conversations" and "Exchanges" updated to "Interactions"
- **Section Names**: "Conversations" → "Interactions"
- **Metrics**: "Total Exchanges" → "Total Interactions"
- **Depth Categories**: Now reference "interactions" instead of "exchanges"
- **Tooltips**: All tooltips updated with consistent terminology

## 🐛 Bug Fixes

### Analytics Service
- Fixed `file.lastActivity` → `file.lastModified` property reference error
- Fixed `exchanges` → `interactions` in SessionData initialization
- Added missing `realHumanMessages` and `systemPrompts` properties to SessionData

### Data Models
- Updated `ConversationMetrics` → `InteractionMetrics`
- Renamed `depthCategories` → `sessionDepthCategories`
- Added proper type definitions for all new properties

## 📊 Metrics Validation

### Overall Statistics (19 Sessions)
- **Total Messages**: 1,217,891
- **Human Messages**: 106,333 (5,596/session)
- **Bot Messages**: 595,460 (31,340/session)
- **Tool Calls**: 481,227 (25,328/session)
- **Interactions**: 100,524 (5,291/session)
- **System Prompts Filtered**: 34,871

### Validation Results
- ✅ Tool Calls per Bot: 0.81:1 (Reasonable)
- ✅ Bot per Human: 5.60:1 (Reasonable)
- ✅ Interactions counting: Accurate sequential tracking

## 🔧 Technical Changes

### Modified Files
1. **`extension/src/models/Analytics.ts`**
   - Renamed interfaces and properties
   - Added new SessionData fields

2. **`extension/src/services/KiroAnalyticsService.ts`**
   - Added `isSystemPrompt()` filtering method
   - Renamed `calculateConversationMetrics()` → `calculateInteractionMetrics()`
   - Updated all property references
   - Fixed bug in SessionData initialization

3. **`extension/src/ui/InsightsTreeProvider.ts`**
   - Updated all UI labels and descriptions
   - Renamed methods: `getConversationItems()` → `getInteractionItems()`
   - Updated tooltips with new terminology
   - Fixed depth category references

4. **`extension/package.json`**
   - Version bump: 1.2.1 → 1.2.2

### Build Information
- **Compiled Size**: 360 KB (minified)
- **Package Size**: 313.14 KB
- **Webpack**: 5.102.1
- **Build Status**: ✅ Success

## 📦 Installation

The extension is packaged as: **`extension/kiroforge-1.2.2.vsix`**

### Quick Install
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX..."
4. Select `extension/kiroforge-1.2.2.vsix`
5. Reload VS Code

See `INSTALLATION-INSTRUCTIONS.md` for detailed installation methods.

## 🧪 Testing Recommendations

1. **Verify Analytics Load**
   - Open Kiro Insights view
   - Click refresh button
   - Confirm data loads without errors

2. **Check Terminology**
   - Expand "Interactions" section (not "Conversations")
   - Verify all labels use "interactions"
   - Check tooltips for consistency

3. **Validate Metrics**
   - Compare human message counts (should be ~106K)
   - Verify interaction counts (~100K)
   - Check per-session averages

4. **Test Filtering**
   - Confirm system prompts are excluded
   - Verify counts are reasonable
   - Check session depth categories

## 📝 Documentation

New documentation files:
- `TERMINOLOGY-UPDATE-COMPLETE.md` - Implementation details
- `INSTALLATION-INSTRUCTIONS.md` - Installation guide
- `RELEASE-NOTES-v1.2.2.md` - This file

## 🔄 Migration Notes

### From v1.2.1 to v1.2.2
- No breaking changes
- Analytics data will be recalculated on first load
- UI terminology will update automatically
- No user action required

### Data Changes
- Human message counts will decrease (system prompts filtered)
- Interaction counts will be more accurate
- Session depth categories will reflect new counting

## 🎯 What's Next

Potential future improvements:
- More detailed per-session breakdowns
- Export analytics to CSV/JSON
- Custom date range filtering
- Workspace-specific analytics
- Tool usage trends over time

## 🙏 Acknowledgments

This release includes comprehensive analytics improvements based on detailed analysis of Kiro IDE logs and validation of counting methodologies.

---

**Version**: 1.2.2  
**Release Date**: $(date)  
**Package**: `extension/kiroforge-1.2.2.vsix`  
**Status**: ✅ Ready for Installation
