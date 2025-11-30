/**
 * Tree provider for Kiro IDE Agent Hooks view
 */

import * as vscode from 'vscode';
import { StorageManager } from '../utils/storage';
import { KiroHookFile } from '../models/KiroHook';

export class KiroHooksTreeProvider implements vscode.TreeDataProvider<KiroHookTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<KiroHookTreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storageManager: StorageManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: KiroHookTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: KiroHookTreeItem): Promise<KiroHookTreeItem[]> {
    if (!element) {
      // Root level - show installed Kiro hooks
      return this.getInstalledKiroHooks();
    }
    return [];
  }

  private async getInstalledKiroHooks(): Promise<KiroHookTreeItem[]> {
    try {
      const kiroHookFiles = await this.storageManager.listKiroHooks();

      if (kiroHookFiles.length === 0) {
        return [];
      }

      const items: KiroHookTreeItem[] = [];

      for (const filename of kiroHookFiles) {
        try {
          const content = await this.storageManager.readKiroHook(filename);
          const hook: KiroHookFile = JSON.parse(content);

          items.push(new KiroHookTreeItem(
            hook.name,
            hook.description,
            filename,
            hook.trigger.icon || 'symbol-event',
            hook.trigger.type
          ));
        } catch (error) {
          console.error(`Failed to parse Kiro hook ${filename}:`, error);
          // Add item with error state
          items.push(new KiroHookTreeItem(
            filename,
            'Error parsing hook file',
            filename,
            'error',
            'unknown'
          ));
        }
      }

      return items;
    } catch (error) {
      console.error('Failed to get installed Kiro hooks:', error);
      return [];
    }
  }
}

class KiroHookTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly hookDescription: string,
    public readonly filename: string,
    iconName: string,
    public readonly triggerType: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    // Don't set description property to avoid extra spacing in tree
    this.tooltip = `${hookDescription}\n\nTrigger: ${triggerType}\nFile: ${filename}`;
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.contextValue = 'kiro-hook-file';

    // Make it clickable to open the file
    this.command = {
      command: 'kiroforge.openKiroHookFile',
      title: 'Open Kiro Hook File',
      arguments: [filename]
    };
  }
}
