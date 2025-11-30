# KiroForge Extension - Analytics Integration Plan

## 📋 Current Extension Structure

### Existing Views:
1. **Approved Steering** (`kiroforge.packs`) - Manages steering packs
2. **Quality Skills** (`kiroforge.hooks`) - Manages quality hooks

### Existing Services:
- `PackManager` - Manages steering packs
- `HookRegistry` - Manages quality hooks
- `LogParser` - Parses logs (currently for metrics)
- `MetricsCollector` - Collects metrics
- `StorageManager` - Manages storage

## 🎯 Integration Goal

Add a **NEW third view** called **"Kiro Insights"** that displays analytics from the Kiro logs without impacting existing functionality.

## ✅ Integration Strategy (Zero Impact)

### 1. **Add New View** (No changes to existing views)
```json
// In package.json - Add to views.kiroforge array
{
  "id": "kiroforge.insights",
  "name": "Kiro Insights"
}
```

### 2. **Create New Files** (No modifications to existing files)

#### New Service: `KiroAnalyticsService.ts`
- Location: `extension/src/services/KiroAnalyticsService.ts`
- Purpose: Analyze Kiro logs and provide metrics
- Methods:
  - `getMessageCounts()` - Message statistics
  - `getConversationDepth()` - Conversation analysis
  - `getToolUsage()` - Tool usage stats
  - `getWorkspaceActivity()` - Workspace breakdown
  - `getTimePatterns()` - Time-based patterns
  - `getSessionMetrics()` - Session analysis

#### New Tree Provider: `InsightsTreeProvider.ts`
- Location: `extension/src/ui/InsightsTreeProvider.ts`
- Purpose: Display analytics in tree view
- Structure:
  ```
  📊 Kiro Insights
  ├── 📈 Overview
  │   ├── Total Messages: 1.19M
  │   ├── Total Sessions: 19
  │   └── Active Days: 17
  ├── 💬 Messages
  │   ├── Today: 77,706
  │   ├── Yesterday: 140,305
  │   └── This Week: 371,161
  ├── 🔧 Tool Usage
  │   ├── fsWrite: 908 (38.9%)
  │   ├── readFile: 643 (27.5%)
  │   └── grepSearch: 387 (16.6%)
  ├── ⏰ Activity Patterns
  │   ├── Peak Hour: 1-2 AM
  │   ├── Most Active Day: Sunday
  │   └── Consistency: 100%
  └── 📁 Workspaces
      ├── kiroforge-insights
      ├── KiroForge
      └── 16 more...
  ```

#### New Model: `Analytics.ts`
- Location: `extension/src/models/Analytics.ts`
- Purpose: Type definitions for analytics data

### 3. **Register New Components** (Minimal changes to extension.ts)

Only add these lines to `extension.ts`:
```typescript
// Import new components
import { InsightsTreeProvider } from './ui/InsightsTreeProvider';
import { KiroAnalyticsService } from './services/KiroAnalyticsService';

// Initialize in activate()
const analyticsService = new KiroAnalyticsService();
const insightsTreeProvider = new InsightsTreeProvider(analyticsService);

// Register tree view
const insightsTreeView = vscode.window.createTreeView('kiroforge.insights', {
  treeDataProvider: insightsTreeProvider,
  showCollapseAll: true
});

// Register refresh command
const refreshInsightsCommand = vscode.commands.registerCommand(
  'kiroforge.refreshInsights',
  () => insightsTreeProvider.refresh()
);

context.subscriptions.push(insightsTreeView, refreshInsightsCommand);
```

### 4. **Add Commands** (New commands only)

```json
// In package.json - Add to commands array
{
  "command": "kiroforge.refreshInsights",
  "title": "Refresh Insights",
  "category": "KiroForge",
  "icon": "$(refresh)"
},
{
  "command": "kiroforge.exportInsights",
  "title": "Export Analytics",
  "category": "KiroForge",
  "icon": "$(export)"
},
{
  "command": "kiroforge.showDetailedAnalytics",
  "title": "Show Detailed Analytics",
  "category": "KiroForge",
  "icon": "$(graph)"
}
```

## 📁 New Files to Create

```
extension/src/
├── services/
│   └── KiroAnalyticsService.ts     ✨ NEW
├── ui/
│   └── InsightsTreeProvider.ts     ✨ NEW
└── models/
    └── Analytics.ts                ✨ NEW
```

## 🔧 Implementation Steps

### Step 1: Create Analytics Service
- Port the JavaScript analytics logic to TypeScript
- Read from: `/Users/[user]/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
- Parse .chat files
- Calculate metrics

### Step 2: Create Tree Provider
- Display metrics in tree view
- Support expand/collapse
- Add icons and formatting
- Implement refresh

### Step 3: Update package.json
- Add new view
- Add new commands
- Add menu items

### Step 4: Register in extension.ts
- Initialize services
- Register tree view
- Register commands

### Step 5: Add Configuration (Optional)
```json
"kiroforge.insights.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable Kiro Insights analytics"
},
"kiroforge.insights.refreshInterval": {
  "type": "number",
  "default": 60,
  "description": "Auto-refresh interval in seconds (0 to disable)"
}
```

## ✅ Zero Impact Guarantee

### What We're NOT Changing:
- ❌ No changes to `PackManager`
- ❌ No changes to `HookRegistry`
- ❌ No changes to `PacksTreeProvider`
- ❌ No changes to `HooksTreeProvider`
- ❌ No changes to existing commands
- ❌ No changes to existing configuration
- ❌ No changes to existing models

### What We're Adding:
- ✅ New view (separate from existing)
- ✅ New service (independent)
- ✅ New tree provider (independent)
- ✅ New commands (new namespace)
- ✅ New models (new files)

### Safety Measures:
1. **Separate namespace** - All new code in separate files
2. **Independent service** - No dependencies on existing services
3. **Optional feature** - Can be disabled via configuration
4. **Error isolation** - Errors won't affect existing features
5. **Backward compatible** - Extension works without analytics

## 🎨 UI Preview

```
┌─────────────────────────────────────┐
│  📦 KiroForge                       │
├─────────────────────────────────────┤
│                                     │
│  📦 Approved Steering               │  ← Existing
│  ├─ Available Packs                 │
│  └─ Installed Packs                 │
│                                     │
│  ⚡ Quality Skills                  │  ← Existing
│  ├─ No Secrets                      │
│  └─ No TODOs                        │
│                                     │
│  📊 Kiro Insights                   │  ← NEW!
│  ├─ 📈 Overview                     │
│  │  ├─ Total Messages: 1.19M        │
│  │  ├─ Total Sessions: 19           │
│  │  └─ Active Days: 17              │
│  ├─ 💬 Messages                     │
│  │  ├─ Today: 77,706                │
│  │  ├─ Yesterday: 140,305           │
│  │  └─ This Week: 371,161           │
│  ├─ 🔧 Tool Usage                   │
│  │  ├─ fsWrite: 908                 │
│  │  ├─ readFile: 643                │
│  │  └─ grepSearch: 387              │
│  ├─ ⏰ Activity                     │
│  │  ├─ Peak Hour: 1-2 AM            │
│  │  ├─ Most Active: Sunday          │
│  │  └─ Consistency: 100%            │
│  └─ 📁 Workspaces (18)              │
│     ├─ kiroforge-insights           │
│     └─ ...                          │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 Benefits

1. **Non-invasive** - Completely separate from existing features
2. **Safe** - No risk to existing functionality
3. **Optional** - Can be disabled if not needed
4. **Performant** - Lazy loading, cached results
5. **Extensible** - Easy to add more metrics later

## 📝 Testing Plan

1. **Existing Features** - Verify all existing features still work
2. **New View** - Test analytics display
3. **Performance** - Ensure no slowdown
4. **Error Handling** - Test with missing/corrupt logs
5. **Configuration** - Test enable/disable

## 🎯 Next Steps

1. ✅ Review this plan
2. Create `KiroAnalyticsService.ts`
3. Create `InsightsTreeProvider.ts`
4. Create `Analytics.ts`
5. Update `package.json`
6. Update `extension.ts`
7. Test integration
8. Package and deploy

---

**Ready to proceed?** This plan ensures zero impact on your existing working extension while adding powerful analytics! 🚀
