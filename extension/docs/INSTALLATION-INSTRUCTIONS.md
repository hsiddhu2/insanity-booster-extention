# KiroForge v1.2.2 Installation Instructions

## 🎉 Package Created Successfully!

The extension has been compiled and packaged as:
**`extension/kiroforge-1.2.2.vsix`**

## What's New in v1.2.2

### ✅ Analytics Improvements
- **System Prompt Filtering**: Accurately filters out system prompts from human message counts
  - Real human messages: ~106K (filtered from 141K)
  - Filters: `<identity>`, `<capabilities>`, `<EnvironmentContext>`, `CONTEXT TRANSFER:`, etc.

- **Accurate Interaction Counting**: 
  - Renamed "Conversations" → "Interactions" throughout
  - Uses proper sequential pair tracking
  - Total interactions: ~100K

- **Updated Terminology**:
  - "Exchanges" → "Interactions" in all UI elements
  - "Conversation Metrics" → "Interaction Metrics"
  - "Depth Categories" → "Session Depth Categories"

- **Bug Fixes**:
  - Fixed property reference errors in analytics service
  - Added missing SessionData properties
  - Corrected interaction counting logic

### 📊 Per-Session Metrics
- Human Messages: 5,596/session
- Bot Messages: 31,340/session
- Tool Calls: 25,328/session
- Interactions: 5,291/session
- Files: 420/session

## Installation Methods

### Method 1: VS Code UI (Recommended)
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX..."
4. Navigate to: `extension/kiroforge-1.2.2.vsix`
5. Click "Install"
6. Reload VS Code when prompted

### Method 2: Command Line
```bash
# Navigate to the extension directory
cd extension

# Install using VS Code CLI
code --install-extension kiroforge-1.2.2.vsix --force
```

### Method 3: Manual Installation
1. Copy `extension/kiroforge-1.2.2.vsix` to your extensions folder:
   - **Mac**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
   - **Linux**: `~/.vscode/extensions/`
2. Extract the VSIX file (it's a ZIP archive)
3. Reload VS Code

## Verification

After installation:

1. **Check Version**: 
   - Open Extensions view (`Cmd+Shift+X`)
   - Search for "KiroForge"
   - Verify version shows **1.2.2**

2. **Test Analytics**:
   - Open the Kiro Insights view in the sidebar
   - Click the refresh button (🔄)
   - Verify the following sections appear:
     - Overview
     - Messages
     - **Interactions** (not "Conversations")
     - Tool Usage
     - Activity Patterns
     - Kiro Projects

3. **Check Terminology**:
   - Expand the "Interactions" section
   - Verify labels show "interactions" instead of "exchanges"
   - Check tooltips use consistent terminology

4. **Verify Metrics**:
   - Check that human message counts look reasonable (~106K total)
   - Verify interaction counts are displayed (~100K total)
   - Confirm per-session averages are shown

## Troubleshooting

### Extension Not Appearing
- Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"
- Check Extensions view for any error messages
- Verify the extension is enabled

### Analytics Not Loading
- Click the refresh button in Kiro Insights view
- Check that Kiro logs exist at: `~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
- Open Developer Tools: `Help` → `Toggle Developer Tools` → Check Console for errors

### Old Version Still Showing
- Uninstall the old version first:
  - Extensions view → KiroForge → Uninstall
  - Reload VS Code
  - Install v1.2.2

## Files Modified

- `extension/src/models/Analytics.ts` - Updated data models
- `extension/src/services/KiroAnalyticsService.ts` - Added filtering and accurate counting
- `extension/src/ui/InsightsTreeProvider.ts` - Updated UI terminology
- `extension/package.json` - Version bump to 1.2.2

## Next Steps

1. Install the extension using one of the methods above
2. Test the analytics functionality
3. Verify the new terminology is consistent
4. Check that system prompts are properly filtered
5. Confirm interaction counts are accurate

## Support

If you encounter any issues:
1. Check the Developer Console for errors
2. Verify Kiro logs are accessible
3. Try refreshing the analytics view
4. Reload VS Code

---

**Version**: 1.2.2  
**Package**: `extension/kiroforge-1.2.2.vsix`  
**Size**: 313.14 KB  
**Build Date**: $(date)
