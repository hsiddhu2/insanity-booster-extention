import * as vscode from 'vscode';

export class WelcomePage {
  private static currentPanel: vscode.WebviewPanel | undefined;

  public static show(context: vscode.ExtensionContext, installedPacksCount = 0) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (WelcomePage.currentPanel) {
      WelcomePage.currentPanel.reveal(columnToShowIn);
      return;
    }

    WelcomePage.currentPanel = vscode.window.createWebviewPanel(
      'kiroforgeWelcome',
      'Welcome to KiroForge',
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    WelcomePage.currentPanel.webview.html = WelcomePage.getHtmlContent(installedPacksCount);

    // Handle messages from the webview
    WelcomePage.currentPanel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'installPacks':
            vscode.commands.executeCommand('kiroforge.installPacks');
            break;
          case 'openSettings':
            vscode.commands.executeCommand('kiroforge.openSettings');
            break;
          case 'viewDocs':
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/hsiddhu2/kiroforge'));
            break;
          case 'close':
            WelcomePage.currentPanel?.dispose();
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    WelcomePage.currentPanel.onDidDispose(
      () => {
        WelcomePage.currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
  }

  private static getHtmlContent(installedPacksCount: number): string {
    const isFirstTime = installedPacksCount === 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to KiroForge</title>
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
      max-width: 800px;
      width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      font-size: 64px;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .subtitle {
      font-size: 20px;
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

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .status-active {
      background: #10b981;
      color: white;
    }

    .status-new {
      background: #3b82f6;
      color: white;
    }

    .welcome-message {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #555;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .feature {
      text-align: center;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      transition: transform 0.2s;
    }

    .feature:hover {
      transform: translateY(-5px);
    }

    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .feature-title {
      font-weight: 600;
      margin-bottom: 5px;
      color: #1e293b;
    }

    .feature-desc {
      font-size: 14px;
      color: #64748b;
    }

    .actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 30px;
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

    .quick-links {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .quick-link {
      color: white;
      text-decoration: none;
      font-size: 14px;
      opacity: 0.9;
      transition: opacity 0.2s;
    }

    .quick-link:hover {
      opacity: 1;
      text-decoration: underline;
    }

    .stats {
      display: flex;
      gap: 30px;
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
      font-size: 32px;
      font-weight: 700;
      color: #8B5CF6;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
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

      .subtitle {
        font-size: 16px;
      }

      .card {
        padding: 24px;
      }

      .features {
        grid-template-columns: 1fr;
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
      <div class="logo">🚀</div>
      <h1>Welcome to KiroForge</h1>
      <p class="subtitle">Elevate Your Code Quality in Kiro IDE</p>
    </div>

    <div class="card">
      ${isFirstTime ? `
        <span class="status-badge status-new">🎉 First Time Setup</span>
        <div class="welcome-message">
          <p><strong>Thank you for installing KiroForge v1.3.0!</strong></p>
          <p>KiroForge brings organizational coding quality standards directly into Kiro IDE through approved steering, quality skills, and Kiro Agent Hooks.</p>
          <p style="margin-top: 10px;"><strong>What's New in v1.3.0:</strong></p>
          <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.8;">
            <li>🎯 <strong>Kiro Agent Hooks</strong> - Automate your workflow with IDE hooks</li>
            <li>📊 <strong>Enhanced Analytics</strong> - Beautiful tooltips with colorful insights</li>
            <li>✨ <strong>Better UX</strong> - Consistent terminology and improved UI</li>
          </ul>
        </div>
      ` : `
        <span class="status-badge status-active">✅ Active</span>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${installedPacksCount}</div>
            <div class="stat-label">Packs Installed</div>
          </div>
          <div class="stat">
            <div class="stat-value">v1.3.0</div>
            <div class="stat-label">Version</div>
          </div>
        </div>
        <div class="welcome-message">
          <p><strong>KiroForge is ready!</strong></p>
          <p>Your extension is active with ${installedPacksCount} steering pack${installedPacksCount !== 1 ? 's' : ''} installed.</p>
        </div>
      `}

      <div class="features">
        <div class="feature">
          <div class="feature-icon">📦</div>
          <div class="feature-title">Approved Steering</div>
          <div class="feature-desc">Install quality standards for your team</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Kiro Agent Hooks</div>
          <div class="feature-desc">Automate workflows with IDE hooks</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-title">Analytics Dashboard</div>
          <div class="feature-desc">Track interactions and productivity</div>
        </div>
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <div class="feature-title">Real-time Validation</div>
          <div class="feature-desc">Catch issues as you code</div>
        </div>
      </div>

      <div class="actions">
        ${isFirstTime ? `
          <button class="btn btn-primary" onclick="installPacks()">
            📦 Install Approved Steering
          </button>
        ` : `
          <button class="btn btn-primary" onclick="installPacks()">
            📦 Manage Packs
          </button>
        `}
        <button class="btn btn-secondary" onclick="openSettings()">
          ⚙️ Settings
        </button>
        <button class="btn btn-secondary" onclick="viewDocs()">
          📚 Documentation
        </button>
      </div>
    </div>

    <div class="quick-links">
      <a href="#" class="quick-link" onclick="viewDocs(); return false;">📖 Read the Docs</a>
      <a href="#" class="quick-link" onclick="openSettings(); return false;">⚙️ Configure Extension</a>
      <a href="#" class="quick-link" onclick="closeWelcome(); return false;">✕ Close</a>
    </div>

    <div class="footer">
      <p>KiroForge v1.3.0 | The Code Quality Platform</p>
      <p style="margin-top: 8px; font-size: 12px; opacity: 0.8;">Join the community at kiro.dev</p>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function installPacks() {
      vscode.postMessage({ command: 'installPacks' });
    }

    function openSettings() {
      vscode.postMessage({ command: 'openSettings' });
    }

    function viewDocs() {
      vscode.postMessage({ command: 'viewDocs' });
    }

    function closeWelcome() {
      vscode.postMessage({ command: 'close' });
    }
  </script>
</body>
</html>`;
  }
}
