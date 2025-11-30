import * as vscode from 'vscode';

export class UninstallPage {
  private static currentPanel: vscode.WebviewPanel | undefined;

  public static show(context: vscode.ExtensionContext, installedPacksCount: number) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (UninstallPage.currentPanel) {
      UninstallPage.currentPanel.reveal(columnToShowIn);
      return;
    }

    UninstallPage.currentPanel = vscode.window.createWebviewPanel(
      'kiroforgeUninstall',
      'KiroForge - Cleanup',
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    UninstallPage.currentPanel.webview.html = UninstallPage.getHtmlContent(installedPacksCount);

    // Handle messages from the webview
    UninstallPage.currentPanel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'removeData':
            vscode.commands.executeCommand('kiroforge.cleanupWorkspace');
            UninstallPage.currentPanel?.dispose();
            break;
          case 'keepData':
            vscode.window.showInformationMessage(
              'KiroForge data kept. To remove later: Command Palette → "KiroForge: Remove Workspace Data"'
            );
            UninstallPage.currentPanel?.dispose();
            break;
          case 'cancel':
            UninstallPage.currentPanel?.dispose();
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    UninstallPage.currentPanel.onDidDispose(
      () => {
        UninstallPage.currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
  }

  private static getHtmlContent(installedPacksCount: number): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiroForge - Cleanup</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: #ffffff;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container {
      max-width: 700px;
      width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .subtitle {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 300;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      color: #333;
      margin-bottom: 20px;
    }

    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .warning-content {
      color: #78350f;
      font-size: 14px;
      line-height: 1.6;
    }

    .info-box {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .info-title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 10px;
    }

    .info-content {
      color: #1e3a8a;
      font-size: 14px;
      line-height: 1.6;
    }

    .file-list {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .file-list li {
      margin: 8px 0;
      color: #475569;
    }

    .stats {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin: 20px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #8B5CF6;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
    }

    .actions {
      display: flex;
      gap: 15px;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .btn {
      flex: 1;
      min-width: 150px;
      padding: 14px 28px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    .btn-danger:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
    }

    .btn-primary {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
    }

    .btn-secondary {
      background: white;
      color: #8B5CF6;
      border: 2px solid #8B5CF6;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      transform: translateY(-2px);
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 14px;
      opacity: 0.8;
    }

    @media (max-width: 600px) {
      h1 {
        font-size: 32px;
      }

      .card {
        padding: 24px;
      }

      .actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🗑️</div>
      <h1>Cleanup Workspace Data</h1>
      <p class="subtitle">Before uninstalling KiroForge</p>
    </div>

    <div class="card">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${installedPacksCount}</div>
          <div class="stat-label">Packs Installed</div>
        </div>
      </div>

      <div class="warning-box">
        <div class="warning-title">
          <span>⚠️</span>
          <span>Workspace Data Will Remain</span>
        </div>
        <div class="warning-content">
          <p>KiroForge has created files in your workspace that will remain after uninstalling the extension. You can choose to remove them now or keep them for future use.</p>
        </div>
      </div>

      <div class="info-box">
        <div class="info-title">📁 Files That Will Be Removed:</div>
        <div class="info-content">
          <ul class="file-list">
            <li>📂 .kiro/steering/ - Installed steering files</li>
            <li>📂 .kiro/kiroforge/hooks/ - Validation hook definitions</li>
            <li>📄 All KiroForge workspace data</li>
          </ul>
          <p style="margin-top: 15px;"><strong>Note:</strong> Your custom files in .kiro/steering/ will be preserved if they weren't installed by KiroForge.</p>
        </div>
      </div>

      <div class="info-box">
        <div class="info-title">💡 What Happens Next:</div>
        <div class="info-content">
          <p><strong>If you remove data:</strong> All KiroForge files will be deleted from your workspace. You'll start fresh if you reinstall.</p>
          <p style="margin-top: 10px;"><strong>If you keep data:</strong> Files remain in your workspace. You can remove them later using the command: <code>KiroForge: Remove Workspace Data</code></p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-danger" onclick="removeData()">
          🗑️ Remove All Data
        </button>
        <button class="btn btn-primary" onclick="keepData()">
          💾 Keep Data
        </button>
        <button class="btn btn-secondary" onclick="cancel()">
          ✕ Cancel
        </button>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for using KiroForge! 💙</p>
      <p style="margin-top: 10px; font-size: 12px;">Join our community: <a href="https://kiro.dev" style="color: white;">kiro.dev</a></p>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function removeData() {
      vscode.postMessage({ command: 'removeData' });
    }

    function keepData() {
      vscode.postMessage({ command: 'keepData' });
    }

    function cancel() {
      vscode.postMessage({ command: 'cancel' });
    }
  </script>
</body>
</html>`;
  }
}
