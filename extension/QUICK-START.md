# KiroForge Quick Start Guide

Get up and running with KiroForge in 5 minutes!

## 1. Install the Extension

### From VSIX
1. Download `kiroforge-1.2.2.vsix`
2. Open Kiro IDE
3. Extensions view (Ctrl+Shift+X)
4. Click "..." → "Install from VSIX..."
5. Select the downloaded file

## 2. Configure (Optional)

If you have a KiroForge backend deployed:

1. Open Settings (Ctrl+,)
2. Search for "KiroForge"
3. Add your configuration:
   - **API Key**: From CloudFormation Outputs → UserApiKey
   - **API URL**: From CloudFormation Outputs → ApiUrl
   - **Packs URL**: From CloudFormation Outputs → SteeringPacksBucketUrl

**Note**: You can use KiroForge without backend configuration for local validation only.

## 3. Install Steering Packs

### Via Command Palette
1. Press Ctrl+Shift+P
2. Type "KiroForge: Install Steering Packs"
3. Select packs to install
4. Wait for installation

### Via Sidebar
1. Click KiroForge icon in Activity Bar
2. In "Approved Steering" view, click download icon
3. Select packs to install

## 4. Start Using KiroForge

### Real-Time Validation
- Just start coding!
- Issues appear automatically as you type
- View issues in Problems panel (Ctrl+Shift+M)

### View Analytics
1. Click KiroForge icon in Activity Bar
2. Scroll to "Kiro Insights" view
3. Explore your productivity metrics

Or click the insights icon in the status bar!

### Export Analytics
1. Open "Kiro Insights" view
2. Click the export icon
3. Choose save location
4. Analyze your data

## 5. Customize Settings

### Disable Real-Time Validation
```json
{
  "kiroforge.enableRealtimeValidation": false
}
```

### Adjust Validation Delay
```json
{
  "kiroforge.validationDelay": 1000
}
```

### Disable Metrics Collection
```json
{
  "kiroforge.enableMetrics": false
}
```

## Common Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Install Packs | Ctrl+Shift+P → "Install" | Install steering packs |
| Show Issues | Ctrl+Shift+M | View validation issues |
| Refresh Insights | - | Update analytics data |
| Export Analytics | - | Export insights to JSON |
| Clear Issues | - | Clear all validation issues |

## Troubleshooting

### Packs Not Installing?
- Check internet connection
- Verify Packs URL in settings
- Run "KiroForge: Test Connection"

### Issues Not Showing?
- Ensure `kiroforge.enableHooks` is true
- Check that packs are installed
- Save the file to trigger validation

### Insights Not Showing?
- Ensure you have some Kiro activity
- Run "KiroForge: Refresh Insights"
- Check `~/.kiro/logs/` exists

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the [docs/](./docs/) directory for feature documentation
- Check [analytics-research/](./analytics-research/) for research scripts

## Getting Help

- Check the troubleshooting section in README.md
- Review extension logs in Output panel
- Contact your team's KiroForge administrator

## Uninstalling

Before uninstalling:
1. Run "KiroForge: Remove Workspace Data"
2. Confirm removal
3. Then uninstall the extension

This ensures clean removal of all KiroForge files.

---

**Happy Coding with KiroForge! 🚀**
