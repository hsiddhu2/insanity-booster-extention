# Testing Instructions for KiroForge v1.2.1

## Installation

The extension has been packaged at:
```
extension/kiroforge-1.2.1.vsix
```

### Install via Command Line
```bash
code --install-extension extension/kiroforge-1.2.1.vsix
```

### Install via VS Code UI
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Click the "..." menu at the top
4. Select "Install from VSIX..."
5. Navigate to `extension/kiroforge-1.2.1.vsix`
6. Click Install

## What to Test

### 1. Overview Section
Open the "Kiro Insights" view and expand the "Overview" section. You should see:
- Visual separators: `═══════════════════════════════════════`
- Section header: `📈 OVERALL STATISTICS`
- Statistics including:
  - Total Sessions
  - Total Chat Files
  - Total Messages
  - Total Exchanges
  - Avg Exchanges/Session
  - Avg Messages/Exchange

### 2. Conversation Depth Categories
1. Expand the "Conversations" section
2. Click on "Depth Categories" to expand
3. You should see:
   - 🟢 Shallow (< 50 exchanges): X sessions
   - 🟡 Medium (50-199 exchanges): X sessions
   - 🟠 Deep (200-499 exchanges): X sessions
   - 🔴 Very Deep (500+ exchanges): X sessions

### 3. Tool Usage Visual Bars
Expand the "Tool Usage" section to see:
- Total Tool Calls count
- Top tools with visual percentage bars:
  ```
  1. fsWrite         XXX (XX.X%) ███████████████████
  2. readFile        XXX (XX.X%) ██████████████
  3. grepSearch      XXX (XX.X%) ████████
  ```

### 4. Tooltips
Hover over any statistic to see rich tooltips with detailed information.

### 5. Status Bar
Check the bottom status bar for the Kiro Insights icon showing quick stats.

## Expected Behavior

- All sections should load without errors
- Numbers should reflect your actual Kiro usage data
- Visual bars should scale proportionally
- Tooltips should display formatted markdown
- Clicking "Refresh" should update all data

## Troubleshooting

If you don't see data:
1. Check that Kiro logs exist at: `~/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent`
2. Click the refresh icon in the Insights view
3. Check the VS Code Developer Console (Help > Toggle Developer Tools) for errors

## Uninstall Previous Version

If you have an older version installed:
1. Go to Extensions
2. Find "KiroForge"
3. Click Uninstall
4. Reload VS Code
5. Install the new version
