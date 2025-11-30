/**
 * Test setup file
 * Configures the testing environment for KiroForge extension tests
 */

// Mock VS Code API
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createTreeView: jest.fn(),
    createWebviewPanel: jest.fn(),
    showQuickPick: jest.fn(),
    showSaveDialog: jest.fn(),
    withProgress: jest.fn((options, task) => task({ report: jest.fn() })),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue?: any) => defaultValue),
      update: jest.fn(),
    })),
    textDocuments: [],
    onDidChangeTextDocument: jest.fn(),
    onDidSaveTextDocument: jest.fn(),
    onDidOpenTextDocument: jest.fn(),
    onDidDeleteFiles: jest.fn(),
    onDidRenameFiles: jest.fn(),
    onDidCloseTextDocument: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    onDidChangeWorkspaceFolders: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  languages: {
    createDiagnosticCollection: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    })),
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path, toString: () => path })),
  },
  Range: jest.fn((startLine, startChar, endLine, endChar) => ({
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  })),
  Diagnostic: jest.fn((range, message, severity) => ({
    range,
    message,
    severity,
    source: 'KiroForge',
  })),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  TreeItem: jest.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ProgressLocation: {
    Notification: 15,
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  EventEmitter: jest.fn(() => ({
    event: jest.fn(),
    fire: jest.fn(),
  })),
}));

// Set test timeout
jest.setTimeout(10000);
