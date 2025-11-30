/**
 * Tree Data Provider for Approved Steering View
 */

import * as vscode from 'vscode';
import { StorageManager } from '../utils/storage';
import { InstalledPack, Pack } from '../models/Pack';
import { PackManager } from '../services/PackManager';

export class PacksTreeProvider implements vscode.TreeDataProvider<PackTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PackTreeItem | undefined | null | void> = new vscode.EventEmitter<PackTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PackTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private storageManager: StorageManager,
    private packManager: PackManager
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PackTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PackTreeItem): Promise<PackTreeItem[]> {
    if (!element) {
      // Root level - show sections for available and installed packs
      const items: PackTreeItem[] = [];
      const installedPacks = this.storageManager.getInstalledPacks();
      const availablePacks = this.packManager.getAvailablePacks();
      
      // Available Packs Section
      if (availablePacks.length > 0) {
        items.push(new PackTreeItem(
          `Available Steering (${availablePacks.length})`,
          'Click to install',
          vscode.TreeItemCollapsibleState.Expanded,
          'available-section'
        ));
      }
      
      // Installed Packs Section
      if (installedPacks.length > 0) {
        items.push(new PackTreeItem(
          `Installed Steering (${installedPacks.length})`,
          '',
          vscode.TreeItemCollapsibleState.Expanded,
          'installed-section'
        ));
      }
      
      return items;
    } else if (element.contextValue === 'available-section') {
      // Show available packs
      const availablePacks = this.packManager.getAvailablePacks();
      const installedPacks = this.storageManager.getInstalledPacks();
      const installedNames = new Set(installedPacks.map(p => p.name));
      
      return availablePacks
        .filter(pack => !installedNames.has(pack.name))
        .map(pack =>
          new PackTreeItem(
            pack.name,
            `v${pack.version}`,
            vscode.TreeItemCollapsibleState.None,
            'available-pack',
            undefined,
            pack
          )
        );
    } else if (element.contextValue === 'installed-section') {
      // Show installed packs
      const installedPacks = this.storageManager.getInstalledPacks();
      return installedPacks.map(pack =>
        new PackTreeItem(
          pack.name,
          `v${pack.version}`,
          vscode.TreeItemCollapsibleState.Collapsed,
          'installed-pack',
          pack
        )
      );
    } else if (element.contextValue === 'installed-pack' && element.pack) {
      // Pack level - show only steering files (hooks are shown in separate view)
      const items: PackTreeItem[] = [];
      
      // Steering files section
      if (element.pack.steeringFiles.length > 0) {
        items.push(new PackTreeItem(
          `Steering Files (${element.pack.steeringFiles.length})`,
          '',
          vscode.TreeItemCollapsibleState.Collapsed,
          'steering-section',
          element.pack
        ));
      }
      
      return items;
    } else if (element.contextValue === 'steering-section' && element.pack) {
      // Show steering files
      return element.pack.steeringFiles.map(file =>
        new PackTreeItem(file, '', vscode.TreeItemCollapsibleState.None, 'steering-file')
      );
    }
    
    return [];
  }
}

export class PackTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly pack?: InstalledPack,
    public readonly availablePack?: Pack
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.contextValue = contextValue;
    
    // Set icons based on type
    switch (contextValue) {
      case 'available-section':
        this.iconPath = new vscode.ThemeIcon('cloud-download');
        break;
      case 'installed-section':
        this.iconPath = new vscode.ThemeIcon('package');
        break;
      case 'available-pack':
        this.iconPath = new vscode.ThemeIcon('cloud');
        break;
      case 'installed-pack':
        this.iconPath = new vscode.ThemeIcon('package');
        break;
      case 'steering-section':
        this.iconPath = new vscode.ThemeIcon('book');
        break;
      case 'steering-file':
        this.iconPath = new vscode.ThemeIcon('file-text');
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
