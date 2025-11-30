/**
 * KiroForge Extension - Main Entry Point
 */

import * as vscode from 'vscode';
import { PackManager } from './services/PackManager';
import { HookRegistry } from './services/HookRegistry';
import { LogParser } from './services/LogParser';
import { MetricsCollector } from './services/MetricsCollector';
import { StorageManager } from './utils/storage';
import { httpClient } from './utils/http';
import { PacksTreeProvider } from './ui/PacksTreeProvider';
import { HooksTreeProvider } from './ui/HooksTreeProvider';
import { KiroHooksTreeProvider } from './ui/KiroHooksTreeProvider';
import { InsightsTreeProvider } from './ui/InsightsTreeProvider';
import { KiroAnalyticsService } from './services/KiroAnalyticsService';
import { InsightsStatusBar } from './ui/InsightsStatusBar';

let packManager: PackManager;
let hookRegistry: HookRegistry;
let logParser: LogParser;
let metricsCollector: MetricsCollector;
let storageManager: StorageManager;
let packsTreeProvider: PacksTreeProvider;
let hooksTreeProvider: HooksTreeProvider;
let kiroHooksTreeProvider: KiroHooksTreeProvider;
let insightsTreeProvider: InsightsTreeProvider;
let analyticsService: KiroAnalyticsService;
let insightsStatusBar: InsightsStatusBar;
let extensionContext: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
  console.log('KiroForge extension is now active!');

  // Store context globally
  extensionContext = context;

  // Initialize services
  storageManager = new StorageManager(context);
  packManager = new PackManager(storageManager);
  metricsCollector = new MetricsCollector(storageManager);
  hookRegistry = new HookRegistry(storageManager, metricsCollector);
  logParser = new LogParser(storageManager);

  // Connect services
  logParser.setMetricsCollector(metricsCollector);

  // Ensure .kiro directories exist (only if workspace is open)
  try {
    if (storageManager.hasWorkspace()) {
      await storageManager.ensureDirectories();
    }
  } catch (error) {
    console.error('Failed to create .kiro directories:', error);
  }

  // Set context for when extension is enabled
  await vscode.commands.executeCommand('setContext', 'kiroforge.enabled', true);

  // Register tree view providers
  registerTreeViews(context);

  // Register commands
  registerCommands(context);

  // Register event handlers
  registerEventHandlers(context);

  // Initialize installed packs and hooks
  await initializeExtension();

  // Check for orphaned hooks (hooks without packs)
  await checkOrphanedHooks();

  // Show welcome message
  showWelcomeMessage();
}

function registerTreeViews(context: vscode.ExtensionContext) {
  // Initialize tree providers
  packsTreeProvider = new PacksTreeProvider(storageManager, packManager);
  hooksTreeProvider = new HooksTreeProvider(storageManager);
  kiroHooksTreeProvider = new KiroHooksTreeProvider(storageManager);

  // Register tree views
  const packsTreeView = vscode.window.createTreeView('kiroforge.packs', {
    treeDataProvider: packsTreeProvider,
    showCollapseAll: true
  });

  const hooksTreeView = vscode.window.createTreeView('kiroforge.hooks', {
    treeDataProvider: hooksTreeProvider,
    showCollapseAll: true
  });

  const kiroHooksTreeView = vscode.window.createTreeView('kiroforge.kiroHooks', {
    treeDataProvider: kiroHooksTreeProvider,
    showCollapseAll: true
  });

  // Add refresh commands for tree views
  const refreshPacksTreeCommand = vscode.commands.registerCommand('kiroforge.refreshPacksTree', () => {
    packsTreeProvider.refresh();
  });

  const refreshHooksTreeCommand = vscode.commands.registerCommand('kiroforge.refreshHooksTree', () => {
    hooksTreeProvider.refresh();
  });

  const refreshKiroHooksTreeCommand = vscode.commands.registerCommand('kiroforge.refreshKiroHooksTree', () => {
    kiroHooksTreeProvider.refresh();
  });

  // Initialize Insights tree provider
  analyticsService = new KiroAnalyticsService();
  insightsTreeProvider = new InsightsTreeProvider(analyticsService);

  const insightsTreeView = vscode.window.createTreeView('kiroforge.insights', {
    treeDataProvider: insightsTreeProvider,
    showCollapseAll: true
  });

  const refreshInsightsCommand = vscode.commands.registerCommand('kiroforge.refreshInsights', () => {
    insightsTreeProvider.refresh();
    if (insightsStatusBar) {
      insightsStatusBar.refresh();
    }
    vscode.window.showInformationMessage('✅ Kiro Insights refreshed!');
  });

  // Initialize status bar
  insightsStatusBar = new InsightsStatusBar(analyticsService, context);

  context.subscriptions.push(
    packsTreeView,
    hooksTreeView,
    kiroHooksTreeView,
    insightsTreeView,
    refreshPacksTreeCommand,
    refreshHooksTreeCommand,
    refreshKiroHooksTreeCommand,
    refreshInsightsCommand
  );
}

function registerCommands(context: vscode.ExtensionContext) {
  // Install Packs command
  const installPacksCommand = vscode.commands.registerCommand('kiroforge.installPacks', async () => {
    try {
      const installedCount = await packManager.showPackInstallationDialog();
      
      // Only proceed if packs were actually installed
      if (installedCount > 0) {
        // Re-register hooks after installation
        await hookRegistry.registerInstalledHooks();
        // Refresh tree views
        packsTreeProvider.refresh();
        hooksTreeProvider.refresh();
        kiroHooksTreeProvider.refresh();
        // Scan workspace to detect issues with newly installed hooks
        await validateOpenDocuments();
        vscode.window.showInformationMessage('✅ Packs installed and workspace scanned for issues.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to install packs: ${error}`);
    }
  });

  // Refresh Packs command
  const refreshPacksCommand = vscode.commands.registerCommand('kiroforge.refreshPacks', async () => {
    try {
      await packManager.refreshPacks();
      // Re-register hooks after refresh
      await hookRegistry.registerInstalledHooks();
      // Refresh tree views
      packsTreeProvider.refresh();
      hooksTreeProvider.refresh();
      kiroHooksTreeProvider.refresh();
      // Scan workspace to detect issues with refreshed hooks
      await validateOpenDocuments();
      vscode.window.showInformationMessage('✅ Packs refreshed and workspace scanned for issues.');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to refresh packs: ${error}`);
    }
  });

  // Show Issues command
  const showIssuesCommand = vscode.commands.registerCommand('kiroforge.showIssues', async () => {
    try {
      await hookRegistry.showIssuesPanel();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to show issues: ${error}`);
    }
  });

  // Open Settings command
  const openSettingsCommand = vscode.commands.registerCommand('kiroforge.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'kiroforge');
  });

  // Test Connection command
  const testConnectionCommand = vscode.commands.registerCommand('kiroforge.testConnection', async () => {
    try {
      const connected = await httpClient.testConnection();
      if (connected) {
        vscode.window.showInformationMessage('✅ Connection to KiroForge services successful!');
      } else {
        vscode.window.showWarningMessage('❌ Failed to connect to KiroForge services. Check your settings.');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Connection test failed: ${error}`);
    }
  });

  // Cleanup Workspace Data command
  const cleanupWorkspaceCommand = vscode.commands.registerCommand('kiroforge.cleanupWorkspace', async () => {
    const result = await vscode.window.showWarningMessage(
      'This will remove all KiroForge data from the current workspace (.kiro directory). This action cannot be undone.',
      { modal: true },
      'Remove Data',
      'Cancel'
    );

    if (result === 'Remove Data') {
      try {
        await storageManager.cleanupWorkspaceData();
        vscode.window.showInformationMessage('✅ KiroForge workspace data removed successfully. You can now safely uninstall the extension.');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to cleanup workspace data: ${error}`);
      }
    }
  });

  // Clear All Issues command
  const clearIssuesCommand = vscode.commands.registerCommand('kiroforge.clearIssues', () => {
    hookRegistry.clearAllDiagnostics();
    vscode.window.showInformationMessage('✅ All KiroForge issues cleared from Problems panel.');
  });

  // Scan Workspace command
  const scanWorkspaceCommand = vscode.commands.registerCommand('kiroforge.scanWorkspace', async () => {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning workspace for issues...',
        cancellable: false
      }, async (progress) => {
        await validateOpenDocuments();
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to scan workspace: ${error}`);
    }
  });

  // Reset Packs command - clears installed packs state
  const resetPacksCommand = vscode.commands.registerCommand('kiroforge.resetPacks', async () => {
    const result = await vscode.window.showWarningMessage(
      'This will reset the installed packs list. You will need to reinstall your packs. Continue?',
      { modal: true },
      'Reset',
      'Cancel'
    );

    if (result === 'Reset') {
      try {
        await storageManager.saveInstalledPacks([]);
        hookRegistry.clearAllDiagnostics();
        
        const reloadResult = await vscode.window.showInformationMessage(
          '✅ Installed packs list has been reset. Reload VS Code to apply changes?',
          'Reload Now',
          'Later'
        );
        
        if (reloadResult === 'Reload Now') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reset packs: ${error}`);
      }
    }
  });

  // Show Pack Status command - diagnostic tool
  const showPackStatusCommand = vscode.commands.registerCommand('kiroforge.showPackStatus', async () => {
    try {
      const installedPacks = storageManager.getInstalledPacks();
      const steeringDir = storageManager.getSteeringDir();
      const hooksDir = storageManager.getHooksDir();
      
      let message = `**Installed Packs (${installedPacks.length})**:\n\n`;
      
      if (installedPacks.length === 0) {
        message += 'No packs installed in state.\n\n';
      } else {
        for (const pack of installedPacks) {
          message += `**${pack.name}** v${pack.version}\n`;
          message += `- Steering files: ${pack.steeringFiles.length}\n`;
          message += `- Hook files: ${pack.hookFiles.length}\n\n`;
        }
      }
      
      message += `**Directories**:\n`;
      message += `- Steering: ${steeringDir}\n`;
      message += `- Hooks: ${hooksDir}\n`;
      
      const panel = vscode.window.createWebviewPanel(
        'kiroforgeStatus',
        'KiroForge Pack Status',
        vscode.ViewColumn.One,
        {}
      );
      
      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { padding: 20px; font-family: var(--vscode-font-family); }
            pre { background: var(--vscode-textBlockQuote-background); padding: 10px; }
          </style>
        </head>
        <body>
          <h1>KiroForge Pack Status</h1>
          <pre>${message}</pre>
        </body>
        </html>
      `;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to show pack status: ${error}`);
    }
  });

  // Open Steering File command
  const openSteeringFileCommand = vscode.commands.registerCommand('kiroforge.openSteeringFile', async (item: any) => {
    try {
      const steeringDir = storageManager.getSteeringDir();
      const filePath = vscode.Uri.file(`${steeringDir}/${item.label}`);
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open steering file: ${error}`);
    }
  });

  // Open Hook File command
  const openHookFileCommand = vscode.commands.registerCommand('kiroforge.openHookFile', async (item: any) => {
    try {
      const hooksDir = storageManager.getHooksDir();
      const filePath = vscode.Uri.file(`${hooksDir}/${item.hookFile}`);
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open hook file: ${error}`);
    }
  });

  // Open Kiro Hook File command
  const openKiroHookFileCommand = vscode.commands.registerCommand('kiroforge.openKiroHookFile', async (filename: string) => {
    try {
      const kiroHooksDir = storageManager.getKiroHooksDir();
      const filePath = vscode.Uri.file(`${kiroHooksDir}/${filename}`);
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open Kiro hook file: ${error}`);
    }
  });

  // Install Single Pack command (from sidebar)
  const installSinglePackCommand = vscode.commands.registerCommand('kiroforge.installSinglePack', async (item: any) => {
    if (!item.availablePack) {
      return;
    }

    try {
      // Check if workspace is open
      if (!storageManager.hasWorkspace()) {
        vscode.window.showErrorMessage('Please open a folder/workspace before installing packs.');
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Installing ${item.availablePack.name}...`,
        cancellable: false
      }, async (progress) => {
        await packManager.installPack(item.availablePack);
        await hookRegistry.registerInstalledHooks();
        await validateOpenDocuments();
      });

      packsTreeProvider.refresh();
      hooksTreeProvider.refresh();
      kiroHooksTreeProvider.refresh();
      vscode.window.showInformationMessage(`✅ Pack "${item.availablePack.name}" installed successfully.`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to install pack: ${error}`);
    }
  });

  // Uninstall Pack command
  const uninstallPackCommand = vscode.commands.registerCommand('kiroforge.uninstallPack', async (item: any) => {
    if (!item.pack) {
      return;
    }

    const result = await vscode.window.showWarningMessage(
      `Uninstall pack "${item.pack.name}"? This will remove all steering files and hooks from this pack.`,
      { modal: true },
      'Uninstall',
      'Cancel'
    );

    if (result === 'Uninstall') {
      try {
        // Uninstall pack (deletes files)
        await packManager.uninstallPack(item.pack.name);
        
        // Clear all diagnostics first
        hookRegistry.clearAllDiagnostics();
        
        // Re-register remaining hooks (from other installed packs)
        await hookRegistry.registerInstalledHooks();
        
        // Validate with remaining hooks only
        await validateOpenDocuments();
        
        // Refresh tree views
        packsTreeProvider.refresh();
        hooksTreeProvider.refresh();
        kiroHooksTreeProvider.refresh();
        
        vscode.window.showInformationMessage(`✅ Pack "${item.pack.name}" uninstalled successfully.`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to uninstall pack: ${error}`);
      }
    }
  });

  // Toggle Metrics command
  const toggleMetricsCommand = vscode.commands.registerCommand('kiroforge.toggleMetrics', async () => {
    const config = vscode.workspace.getConfiguration('kiroforge');
    const currentValue = config.get<boolean>('enableMetrics', true);
    const newValue = !currentValue;
    
    await config.update('enableMetrics', newValue, vscode.ConfigurationTarget.Global);
    metricsCollector.updateConfig();
    
    const status = newValue ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(`✅ Metrics collection ${status}.`);
  });

  // Show Metrics Status command
  const showMetricsStatusCommand = vscode.commands.registerCommand('kiroforge.showMetricsStatus', () => {
    const config = vscode.workspace.getConfiguration('kiroforge');
    const enabled = config.get<boolean>('enableMetrics', true);
    const queueStatus = metricsCollector.getOfflineQueueStatus();
    
    const statusMessage = [
      `**Metrics Collection**: ${enabled ? '✅ Enabled' : '❌ Disabled'}`,
      `**Connection Status**: ${queueStatus.isOnline ? '🟢 Online' : '🔴 Offline'}`,
      `**Offline Queue**: ${queueStatus.size} metrics pending`,
      '',
      enabled ? 'Metrics are being collected and sent to the backend.' : 'Metrics collection is disabled. Enable in settings to track compliance data.',
      queueStatus.size > 0 ? `\n⚠️ ${queueStatus.size} metrics are queued offline and will be sent when connection is restored.` : ''
    ].join('\n');
    
    vscode.window.showInformationMessage(statusMessage, { modal: true });
  });

  // Show Welcome Page command
  const showWelcomeCommand = vscode.commands.registerCommand('kiroforge.showWelcome', () => {
    const installedPacks = storageManager.getInstalledPacks();
    const { WelcomePage } = require('./ui/WelcomePage');
    WelcomePage.show(extensionContext, installedPacks.length);
  });

  // Retry Offline Metrics command
  const retryOfflineMetricsCommand = vscode.commands.registerCommand('kiroforge.retryOfflineMetrics', async () => {
    const queueStatus = metricsCollector.getOfflineQueueStatus();
    
    if (queueStatus.size === 0) {
      vscode.window.showInformationMessage('No offline metrics to retry.');
      return;
    }
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Retrying ${queueStatus.size} offline metrics...`,
        cancellable: false
      }, async () => {
        await metricsCollector.retryOfflineQueue();
      });
      
      const newStatus = metricsCollector.getOfflineQueueStatus();
      if (newStatus.size === 0) {
        vscode.window.showInformationMessage('✅ All offline metrics sent successfully!');
      } else {
        vscode.window.showWarningMessage(`⚠️ ${newStatus.size} metrics still pending. Will retry automatically.`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to retry offline metrics: ${error}`);
    }
  });

  // Show Insights Quick Pick command (for status bar click)
  const showInsightsQuickPickCommand = vscode.commands.registerCommand('kiroforge.showInsightsQuickPick', async () => {
    try {
      const analytics = await analyticsService.getAnalytics();
      
      const items: vscode.QuickPickItem[] = [
        {
          label: '$(graph) Overview',
          description: `${(analytics.messages.total / 1000000).toFixed(2)}M messages, ${analytics.sessions.totalSessions} sessions`,
          detail: 'View complete analytics overview'
        },
        {
          label: '$(comment-discussion) Messages',
          description: `Today: ${(analytics.messages.today / 1000).toFixed(1)}K | Week: ${(analytics.messages.thisWeek / 1000).toFixed(1)}K`,
          detail: 'Message breakdown by time period'
        },
        {
          label: '$(tools) Tool Usage',
          description: `${analytics.tools.totalCalls.toLocaleString()} calls | Top: ${analytics.tools.topTools[0]?.name || 'N/A'}`,
          detail: 'Tool usage statistics'
        },
        {
          label: '$(clock) Activity Patterns',
          description: `Peak: ${analytics.timePatterns.peakHour}:00 | ${analytics.timePatterns.peakDay}`,
          detail: 'Time-based activity analysis'
        },
        {
          label: '$(folder) Kiro Projects',
          description: `${analytics.workspaces.totalWorkspaces} projects`,
          detail: 'Kiro project activity breakdown'
        },
        {
          label: '$(export) Export Analytics',
          description: 'Save analytics to JSON file',
          detail: 'Export complete analytics data'
        },
        {
          label: '$(refresh) Refresh Data',
          description: 'Reload analytics from logs',
          detail: 'Force refresh analytics'
        }
      ];
      
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: '📊 Kiro Insights - Select an option',
        matchOnDescription: true,
        matchOnDetail: true
      });
      
      if (selected) {
        if (selected.label.includes('Export')) {
          vscode.commands.executeCommand('kiroforge.exportInsights');
        } else if (selected.label.includes('Refresh')) {
          vscode.commands.executeCommand('kiroforge.refreshInsights');
        } else {
          // Remove VS Code icon syntax from label for display
          const cleanLabel = selected.label.replace(/\$\([^)]+\)\s*/g, '');
          
          // Show detailed info in notification
          vscode.window.showInformationMessage(
            `${cleanLabel}\n\n${selected.description}\n\n${selected.detail}`
          );
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to show insights: ${error}`);
    }
  });

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

  // Open Workspace command
  const openWorkspaceCommand = vscode.commands.registerCommand('kiroforge.openWorkspace', async (workspacePath: string) => {
    try {
      const uri = vscode.Uri.file(workspacePath);
      
      // Check if path exists
      const fs = require('fs-extra');
      if (!await fs.pathExists(workspacePath)) {
        vscode.window.showWarningMessage(`Workspace path no longer exists: ${workspacePath}`);
        return;
      }
      
      // Ask user if they want to open in new window or current window
      const choice = await vscode.window.showQuickPick(
        [
          { label: '$(window) Open in New Window', value: 'new' },
          { label: '$(replace) Open in Current Window', value: 'current' }
        ],
        {
          placeHolder: `Open workspace: ${workspacePath.split('/').pop()}`
        }
      );
      
      if (choice) {
        const newWindow = choice.value === 'new';
        await vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open workspace: ${error}`);
    }
  });

  context.subscriptions.push(
    installPacksCommand,
    refreshPacksCommand,
    showIssuesCommand,
    openSettingsCommand,
    testConnectionCommand,
    cleanupWorkspaceCommand,
    clearIssuesCommand,
    scanWorkspaceCommand,
    resetPacksCommand,
    showPackStatusCommand,
    openSteeringFileCommand,
    openHookFileCommand,
    openKiroHookFileCommand,
    installSinglePackCommand,
    uninstallPackCommand,
    toggleMetricsCommand,
    showMetricsStatusCommand,
    retryOfflineMetricsCommand,
    showWelcomeCommand,
    showInsightsQuickPickCommand,
    exportInsightsCommand,
    openWorkspaceCommand
  );
}

function registerEventHandlers(context: vscode.ExtensionContext) {
  // Debounce timer for real-time validation
  let validationTimeout: NodeJS.Timeout | undefined;

  // Real-time validation as user types
  const onDidChangeDocument = vscode.workspace.onDidChangeTextDocument((event) => {
    if (!vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      return;
    }

    // Check if real-time validation is enabled (DISABLED BY DEFAULT for performance)
    const realtimeEnabled = vscode.workspace.getConfiguration('kiroforge').get('enableRealtimeValidation', false);
    if (!realtimeEnabled) {
      return;
    }

    // Get configurable delay
    const validationDelay = vscode.workspace.getConfiguration('kiroforge').get('validationDelay', 500);

    // Clear previous timeout properly
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      validationTimeout = undefined;
    }

    // Debounce: wait for user to stop typing
    validationTimeout = setTimeout(async () => {
      try {
        const result = await hookRegistry.validateDocument(event.document);
        console.log(`Real-time validation: ${event.document.fileName} - ${result.violations.length} violations`);
        
        // Note: We don't collect metrics for real-time validation to avoid spam
        // Metrics are only collected on save
      } catch (error) {
        console.error('Real-time validation error:', error);
      } finally {
        validationTimeout = undefined;
      }
    }, validationDelay);
  });

  // Add cleanup disposable for timeout
  context.subscriptions.push({
    dispose: () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
        validationTimeout = undefined;
      }
    }
  });

  // File save event - trigger hook validation
  const onDidSaveDocument = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      // Validation now automatically collects metrics via HookRegistry
      await hookRegistry.validateDocument(document);
    }
  });

  // File open event - validate newly opened files
  const onDidOpenDocument = vscode.workspace.onDidOpenTextDocument(async (document) => {
    if (vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      // Skip untitled documents and non-file schemes
      if (document.uri.scheme !== 'file') {
        return;
      }
      
      const result = await hookRegistry.validateDocument(document);
      console.log(`Validated opened file: ${document.fileName} - ${result.violations.length} violations`);
    }
  });

  // File delete event - clear diagnostics for deleted files
  const onDidDeleteFiles = vscode.workspace.onDidDeleteFiles((event) => {
    if (vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      for (const uri of event.files) {
        hookRegistry.clearFileDiagnostics(uri);
        console.log(`Cleared diagnostics for deleted file: ${uri.fsPath}`);
      }
    }
  });

  // File rename event - re-validate renamed files
  const onDidRenameFiles = vscode.workspace.onDidRenameFiles(async (event) => {
    if (vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      for (const file of event.files) {
        // Clear diagnostics from old file
        hookRegistry.clearFileDiagnostics(file.oldUri);
        console.log(`Cleared diagnostics for renamed file: ${file.oldUri.fsPath}`);
        
        // Re-validate the new file if it's open
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === file.newUri.toString());
        if (document) {
          // Validation now automatically collects metrics via HookRegistry
          const result = await hookRegistry.validateDocument(document);
          console.log(`Re-validated renamed file: ${file.newUri.fsPath} - ${result.violations.length} violations`);
        }
      }
    }
  });

  // File close event - optionally clear diagnostics when file is closed
  const onDidCloseDocument = vscode.workspace.onDidCloseTextDocument((document) => {
    // Only clear if the file is not in the workspace anymore
    // This prevents clearing diagnostics when just switching tabs
    if (!vscode.workspace.textDocuments.includes(document)) {
      // File was closed and is not open in any other tab
      // We keep diagnostics visible in Problems panel even after closing
      // Users can manually clear them if needed
    }
  });

  // Configuration change event
  const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('kiroforge')) {
      httpClient.updateConfig();
      metricsCollector.updateConfig();
      vscode.window.showInformationMessage('KiroForge configuration updated!');
    }
  });

  // Workspace change event
  const onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
    // Reinitialize when workspace changes
    await initializeExtension();
  });

  context.subscriptions.push(
    onDidChangeDocument,
    onDidSaveDocument,
    onDidOpenDocument,
    onDidDeleteFiles,
    onDidRenameFiles,
    onDidCloseDocument,
    onDidChangeConfiguration,
    onDidChangeWorkspaceFolders
  );
}

/**
 * Check for orphaned hooks (hooks exist but no packs installed)
 * Offers to clean them up automatically
 */
async function checkOrphanedHooks() {
  try {
    if (!storageManager.hasWorkspace()) {
      return;
    }

    const installedPacks = storageManager.getInstalledPacks();
    const hookFiles = await storageManager.listHookFiles();

    // If hooks exist but no packs installed, they're orphaned
    if (hookFiles.length > 0 && installedPacks.length === 0) {
      const result = await vscode.window.showWarningMessage(
        `⚠️ KiroForge: Found ${hookFiles.length} orphaned hook file(s) from previous installation. These are useless without packs. Clean them up?`,
        'Clean Up Hooks',
        'Keep Them'
      );

      if (result === 'Clean Up Hooks') {
        try {
          const kiroForgeDir = storageManager.getKiroForgeDir();
          const fs = require('fs-extra');
          if (await fs.pathExists(kiroForgeDir)) {
            await fs.remove(kiroForgeDir);
            vscode.window.showInformationMessage('✅ Orphaned KiroForge hooks cleaned up successfully.');
          }
        } catch (error) {
          console.error('Failed to clean up orphaned hooks:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check for orphaned hooks:', error);
  }
}

async function initializeExtension() {
  try {
    // Load installed packs
    await packManager.loadInstalledPacks();

    // Register hooks for installed packs
    await hookRegistry.registerInstalledHooks();

    // Start log monitoring if enabled
    if (vscode.workspace.getConfiguration('kiroforge').get('enableMetrics')) {
      await logParser.startMonitoring();
    }

    // Validate all open documents on startup
    if (vscode.workspace.getConfiguration('kiroforge').get('enableHooks')) {
      await validateOpenDocuments();
    }

    console.log('KiroForge extension initialized successfully');
  } catch (error) {
    console.error('Failed to initialize KiroForge extension:', error);
    vscode.window.showWarningMessage('KiroForge initialization failed. Some features may not work.');
  }
}

/**
 * Validate all currently open documents
 */
async function validateOpenDocuments() {
  const openDocuments = vscode.workspace.textDocuments;
  let validatedCount = 0;
  
  // EMERGENCY FIX: Limit to first 5 files to prevent memory exhaustion
  // TODO: Implement proper batching with memory management
  const MAX_FILES_TO_VALIDATE = 5;
  let filesValidated = 0;
  
  for (const document of openDocuments) {
    // Skip untitled documents and non-file schemes
    if (document.uri.scheme !== 'file') {
      continue;
    }
    
    // EMERGENCY FIX: Stop after MAX_FILES_TO_VALIDATE
    if (filesValidated >= MAX_FILES_TO_VALIDATE) {
      console.log(`Skipping validation of remaining files to prevent memory issues (validated ${filesValidated} files)`);
      break;
    }
    
    try {
      const result = await hookRegistry.validateDocument(document);
      filesValidated++;
      if (result.violations.length > 0) {
        validatedCount++;
        console.log(`Initial validation: ${document.fileName} - ${result.violations.length} violations`);
      }
    } catch (error) {
      console.error(`Failed to validate ${document.fileName}:`, error);
    }
  }
  
  if (validatedCount > 0) {
    vscode.window.showInformationMessage(
      `KiroForge: Found issues in ${validatedCount} open file(s). Check Problems panel.`,
      'Show Problems'
    ).then(selection => {
      if (selection === 'Show Problems') {
        vscode.commands.executeCommand('workbench.action.problems.focus');
      }
    });
  }
}

function showWelcomeMessage() {
  const installedPacks = storageManager.getInstalledPacks();
  
  // Show professional welcome page
  const { WelcomePage } = require('./ui/WelcomePage');
  WelcomePage.show(extensionContext, installedPacks.length);
}

export async function deactivate() {
  console.log('KiroForge extension is now deactivated');
  
  // Clean up services
  if (logParser) {
    logParser.stopMonitoring();
  }
  
  if (metricsCollector) {
    metricsCollector.cleanup();
  }
  
  // Clear all diagnostics
  if (hookRegistry) {
    hookRegistry.clearAllDiagnostics();
  }

  // Check if workspace has KiroForge data
  const hasWorkspaceData = storageManager && storageManager.hasWorkspace();
  if (hasWorkspaceData) {
    const installedPacks = storageManager.getInstalledPacks();
    
    if (installedPacks.length > 0) {
      // Show professional uninstall page
      const { UninstallPage } = require('./ui/UninstallPage');
      UninstallPage.show(extensionContext, installedPacks.length);
    }
  }
}
