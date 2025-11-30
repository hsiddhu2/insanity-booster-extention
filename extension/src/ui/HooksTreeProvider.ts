/**
 * Tree Data Provider for Quality Skills View
 */

import * as vscode from 'vscode';
import { StorageManager } from '../utils/storage';
import * as fs from 'fs-extra';
import * as path from 'path';

export class HooksTreeProvider implements vscode.TreeDataProvider<HookTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HookTreeItem | undefined | null | void> = new vscode.EventEmitter<HookTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HookTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  
  constructor(private storageManager: StorageManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HookTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HookTreeItem): Promise<HookTreeItem[]> {
    if (!element) {
      // Root level - show hook files
      try {
        const hookFiles = await this.storageManager.listHookFiles();
        
        if (hookFiles.length === 0) {
          // Return empty array to show viewsWelcome message from package.json
          return [];
        }
        
        const items: HookTreeItem[] = [];
        
        for (const hookFile of hookFiles) {
          const content = await this.storageManager.readHookFile(hookFile);
          const hookDef = JSON.parse(content);
          
          items.push(new HookTreeItem(
            hookDef.name || hookFile,
            hookDef.description || '',
            vscode.TreeItemCollapsibleState.Collapsed,
            'hook-file',
            hookFile,
            hookDef
          ));
        }
        
        return items;
      } catch (error) {
        console.error('Failed to load hooks:', error);
        return [new HookTreeItem('Error loading hooks', '', vscode.TreeItemCollapsibleState.None, 'error')];
      }
    } else if (element.contextValue === 'hook-file' && element.hookDef) {
      // Show individual hooks within the file
      const hooks = element.hookDef.hooks || [];
      return hooks.map((hook: any) =>
        new HookTreeItem(
          hook.name || hook.id,
          `${hook.validation.type} - ${hook.severity}`,
          vscode.TreeItemCollapsibleState.None,
          'hook',
          undefined,
          hook
        )
      );
    }
    
    return [];
  }
}

export class HookTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly hookFile?: string,
    public readonly hookDef?: any
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.contextValue = contextValue;
    
    // Set icons and tooltips based on type
    switch (contextValue) {
      case 'hook-file':
        this.iconPath = new vscode.ThemeIcon('file-code');
        this.tooltip = `Hook file: ${hookFile}`;
        break;
      case 'hook':
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-conditional');
        this.tooltip = hookDef?.validation?.message || hookDef?.description;
        break;
      case 'info':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
      case 'error':
        this.iconPath = new vscode.ThemeIcon('error');
        break;
    }
  }
}
