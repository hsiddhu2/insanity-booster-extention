# Integration Changes Required

## ✅ Files Created (Complete)

1. ✅ `extension/src/models/Analytics.ts` - Type definitions
2. ✅ `extension/src/services/KiroAnalyticsService.ts` - Analytics logic
3. ✅ `extension/src/ui/InsightsTreeProvider.ts` - Tree view provider

## 📝 Files to Update

### 1. `extension/package.json`

#### Add to `views.kiroforge` array (after line ~90):
```json
{
  "id": "kiroforge.insights",
  "name": "Kiro Insights"
}
```

#### Add to `viewsWelcome` array (after line ~100):
```json
{
  "view": "kiroforge.insights",
  "contents": "Loading Kiro analytics...\\n[Refresh](command:kiroforge.refreshInsights)"
}
```

#### Add to `commands` array (after line ~50):
```json
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
}
```

#### Add to `menus.view/title` array (after line ~110):
```json
{
  "command": "kiroforge.refreshInsights",
  "when": "view == kiroforge.insights",
  "group": "navigation"
}
```

#### Add to `configuration.properties` (optional, after line ~200):
```json
"kiroforge.insights.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable Kiro Insights analytics"
},
"kiroforge.insights.autoRefresh": {
  "type": "boolean",
  "default": false,
  "description": "Auto-refresh insights every minute"
}
```

### 2. `extension/src/extension.ts`

#### Add imports (after line 10):
```typescript
import { InsightsTreeProvider } from './ui/InsightsTreeProvider';
import { KiroAnalyticsService } from './services/KiroAnalyticsService';
```

#### Add global variables (after line 20):
```typescript
let analyticsService: KiroAnalyticsService;
let insightsTreeProvider: InsightsTreeProvider;
```

#### In `registerTreeViews()` function (after line 60):
```typescript
// Initialize Insights tree provider
analyticsService = new KiroAnalyticsService();
insightsTreeProvider = new InsightsTreeProvider(analyticsService);

// Register Insights tree view
const insightsTreeView = vscode.window.createTreeView('kiroforge.insights', {
  treeDataProvider: insightsTreeProvider,
  showCollapseAll: true
});

// Add refresh command for Insights
const refreshInsightsCommand = vscode.commands.registerCommand('kiroforge.refreshInsights', () => {
  insightsTreeProvider.refresh();
  vscode.window.showInformationMessage('✅ Kiro Insights refreshed!');
});

context.subscriptions.push(
  insightsTreeView,
  refreshInsightsCommand
);
```

#### In `registerCommands()` function (after line 300):
```typescript
// Export Insights command
const exportInsightsCommand = vscode.commands.registerCommand('kiroforge.exportInsights', async () => {
  try {
    const analytics = await analyticsService.getAnalytics(true);
    const json = JSON.stringify(analytics, null, 2);
    
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('kiro-insights.json'),
      filters: { 'JSON': ['json'] }
    });
    
    if (saveUri) {
      const fs = require('fs-extra');
      await fs.writeFile(saveUri.fsPath, json);
      vscode.window.showInformationMessage('✅ Analytics exported successfully!');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to export analytics: ${error}`);
  }
});

context.subscriptions.push(exportInsightsCommand);
```

## 🧪 Testing Checklist

After making these changes:

1. ✅ Compile the extension: `npm run compile`
2. ✅ Check for TypeScript errors
3. ✅ Test in Extension Development Host (F5)
4. ✅ Verify existing features still work:
   - Approved Steering view
   - Quality Skills view
   - All existing commands
5. ✅ Verify new Insights view:
   - Shows analytics data
   - Refresh button works
   - Export command works
6. ✅ Package extension: `npm run package`

## 📦 Exact Line Numbers for Updates

### package.json Updates:

**Line ~92** (in views.kiroforge array, after hooks view):
```json
,
{
  "id": "kiroforge.insights",
  "name": "Kiro Insights"
}
```

**Line ~102** (in viewsWelcome array):
```json
,
{
  "view": "kiroforge.insights",
  "contents": "Loading Kiro analytics...\\n[Refresh](command:kiroforge.refreshInsights)"
}
```

**Line ~60** (in commands array):
```json
,
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
}
```

**Line ~125** (in menus.view/title array):
```json
,
{
  "command": "kiroforge.refreshInsights",
  "when": "view == kiroforge.insights",
  "group": "navigation"
}
```

### extension.ts Updates:

**After line 10** (imports):
```typescript
import { InsightsTreeProvider } from './ui/InsightsTreeProvider';
import { KiroAnalyticsService } from './services/KiroAnalyticsService';
```

**After line 20** (global variables):
```typescript
let analyticsService: KiroAnalyticsService;
let insightsTreeProvider: InsightsTreeProvider;
```

**In registerTreeViews() - after line 75**:
```typescript
// Initialize Insights tree provider
analyticsService = new KiroAnalyticsService();
insightsTreeProvider = new InsightsTreeProvider(analyticsService);

const insightsTreeView = vscode.window.createTreeView('kiroforge.insights', {
  treeDataProvider: insightsTreeProvider,
  showCollapseAll: true
});

const refreshInsightsCommand = vscode.commands.registerCommand('kiroforge.refreshInsights', () => {
  insightsTreeProvider.refresh();
  vscode.window.showInformationMessage('✅ Kiro Insights refreshed!');
});

context.subscriptions.push(insightsTreeView, refreshInsightsCommand);
```

**In registerCommands() - at the end before context.subscriptions.push**:
```typescript
// Export Insights command
const exportInsightsCommand = vscode.commands.registerCommand('kiroforge.exportInsights', async () => {
  try {
    const analytics = await analyticsService.getAnalytics(true);
    const json = JSON.stringify(analytics, null, 2);
    
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('kiro-insights.json'),
      filters: { 'JSON': ['json'] }
    });
    
    if (saveUri) {
      const fs = require('fs-extra');
      await fs.writeFile(saveUri.fsPath, json);
      vscode.window.showInformationMessage('✅ Analytics exported successfully!');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to export analytics: ${error}`);
  }
});

context.subscriptions.push(exportInsightsCommand);
```

## 🎯 Summary

- **3 new files created** ✅
- **2 files to update** (package.json, extension.ts)
- **~50 lines of code to add** (mostly configuration)
- **Zero changes to existing features** ✅
- **Fully backward compatible** ✅

Ready to compile and test! 🚀
