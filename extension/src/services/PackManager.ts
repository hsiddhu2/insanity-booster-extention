/**
 * Pack Manager Service - Handles steering pack discovery, download, and installation
 */

import * as vscode from 'vscode';
import { Pack, PackManifest, PackIndex, InstalledPack } from '../models/Pack';
import { StorageManager } from '../utils/storage';
import { httpClient } from '../utils/http';
import * as path from 'path';

export class PackManager {
  private storageManager: StorageManager;
  private availablePacks: Pack[] = [];

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Discover available packs from S3
   */
  async discoverPacks(): Promise<Pack[]> {
    try {
      const packIndex: PackIndex = await httpClient.getPackIndex();
      this.availablePacks = packIndex.steeringPacks.map(pack => ({
        ...pack,
        installed: this.storageManager.isPackInstalled(pack.name)
      }));
      return this.availablePacks;
    } catch (error) {
      console.error('Failed to discover packs:', error);
      throw new Error('Failed to fetch pack index from S3');
    }
  }

  /**
   * Show pack installation dialog
   * @returns Number of packs installed (0 if cancelled or none selected)
   */
  async showPackInstallationDialog(): Promise<number> {
    try {
      // Check if workspace is open
      if (!this.storageManager.hasWorkspace()) {
        vscode.window.showErrorMessage('Please open a folder/workspace before installing packs.');
        return 0;
      }

      // Show loading message
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Discovering approved steering...",
        cancellable: false
      }, async () => {
        await this.discoverPacks();
      });

      // Filter out already installed packs
      const uninstalledPacks = this.availablePacks.filter(pack => !pack.installed);
      
      if (uninstalledPacks.length === 0) {
        vscode.window.showInformationMessage('All available packs are already installed!');
        return 0;
      }

      // Create quick pick items
      const quickPickItems = uninstalledPacks.map(pack => ({
        label: pack.name,
        description: pack.version,
        detail: pack.description,
        pack: pack
      }));

      // Show pack selection dialog
      const selectedItems = await vscode.window.showQuickPick(quickPickItems, {
        canPickMany: true,
        placeHolder: 'Select approved steering to install',
        title: 'Install Approved Steering'
      });

      if (!selectedItems || selectedItems.length === 0) {
        return 0;
      }

      // Install selected packs
      for (const item of selectedItems) {
        await this.installPack(item.pack);
      }

      vscode.window.showInformationMessage(
        `Successfully installed ${selectedItems.length} pack(s)!`
      );
      
      return selectedItems.length;

    } catch (error) {
      console.error('Pack installation dialog failed:', error);
      throw error;
    }
  }

  /**
   * Install a specific pack
   */
  async installPack(pack: Pack): Promise<void> {
    return vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Installing ${pack.name}...`,
      cancellable: false
    }, async (progress) => {
      try {
        // Ensure directories exist before installing
        await this.storageManager.ensureDirectories();
        
        progress.report({ increment: 10, message: 'Downloading manifest...' });
        
        // Download pack manifest
        const manifest: PackManifest = await httpClient.getPackManifest(pack.name, pack.version);
        
        progress.report({ increment: 20, message: 'Downloading steering files...' });
        
        // Download steering files
        const steeringFiles: string[] = [];
        for (const steeringFile of manifest.steeringFiles) {
          try {
            const content = await httpClient.downloadSteeringFile(
              pack.name, 
              pack.version, 
              steeringFile.file
            );
            
            const filename = path.basename(steeringFile.file);
            await this.storageManager.saveSteeringFile(filename, content);
            steeringFiles.push(filename);
            console.log(`Downloaded steering file: ${filename}`);
          } catch (error) {
            console.error(`Failed to download steering file ${steeringFile.file}:`, error);
            throw error;
          }
        }
        
        progress.report({ increment: 30, message: 'Downloading quality skills...' });
        
        // Download hook files (quality skills)
        const hookFiles: string[] = [];
        for (const hookFile of manifest.hooks) {
          try {
            const content = await httpClient.downloadHookFile(
              pack.name, 
              pack.version, 
              hookFile.file
            );
            
            const filename = path.basename(hookFile.file);
            await this.storageManager.saveHookFile(filename, JSON.stringify(content, null, 2));
            hookFiles.push(filename);
            console.log(`Downloaded quality skill: ${filename}`);
          } catch (error) {
            console.error(`Failed to download hook file ${hookFile.file}:`, error);
            throw error;
          }
        }
        
        // Download Kiro IDE hooks (if present)
        progress.report({ increment: 20, message: 'Downloading Kiro hooks...' });
        const kiroHookFiles: string[] = [];
        if (manifest.kiroHooks && manifest.kiroHooks.length > 0) {
          for (const kiroHook of manifest.kiroHooks) {
            try {
              // Download as raw text (already JSON string from S3)
              const content = await httpClient.downloadKiroHook(
                pack.name, 
                pack.version, 
                kiroHook.file
              );
              
              let filename = path.basename(kiroHook.file);
              
              // WORKAROUND: S3 files are stored as .json (so Lambda serves them as text)
              // but Kiro IDE expects .kiro.hook extension
              // So we rename .json to .kiro.hook when saving locally
              if (filename.endsWith('.json')) {
                filename = filename.replace(/\.json$/, '.kiro.hook');
                console.log(`Renaming ${path.basename(kiroHook.file)} to ${filename} for Kiro IDE compatibility`);
              }
              
              // Validate filename format (xxx-xxx.kiro.hook)
              if (!this.storageManager.isValidKiroHookFilename(filename)) {
                console.warn(`Invalid Kiro hook filename: ${filename}. Must match pattern: xxx-xxx.kiro.hook`);
                continue;
              }
              
              // Content is already a JSON string from S3, save it directly
              await this.storageManager.saveKiroHook(filename, content);
              kiroHookFiles.push(filename);
              console.log(`Downloaded Kiro hook: ${filename}`);
            } catch (error) {
              console.error(`Failed to download Kiro hook ${kiroHook.file}:`, error);
              // Don't throw - Kiro hooks are optional
              console.warn(`Skipping Kiro hook ${kiroHook.file}`);
            }
          }
        }
        
        progress.report({ increment: 10, message: 'Registering pack...' });
        
        // Register installed pack
        const installedPack: InstalledPack = {
          name: pack.name,
          version: pack.version,
          installedAt: new Date(),
          steeringFiles,
          hookFiles,
          kiroHookFiles: kiroHookFiles.length > 0 ? kiroHookFiles : undefined
        };
        
        await this.storageManager.addInstalledPack(installedPack);
        
        progress.report({ increment: 10, message: 'Complete!' });
        
        console.log(`Successfully installed pack: ${pack.name}`);
        
      } catch (error) {
        console.error(`Failed to install pack ${pack.name}:`, error);
        throw new Error(`Failed to install ${pack.name}: ${error}`);
      }
    });
  }

  /**
   * Uninstall a pack
   */
  async uninstallPack(packName: string): Promise<void> {
    try {
      // Get pack info before removing
      const pack = this.storageManager.getInstalledPacks().find(p => p.name === packName);
      
      if (!pack) {
        throw new Error(`Pack ${packName} is not installed`);
      }
      
      // Delete steering files
      for (const steeringFile of pack.steeringFiles) {
        try {
          await this.storageManager.deleteSteeringFile(steeringFile);
          console.log(`Deleted steering file: ${steeringFile}`);
        } catch (error) {
          console.error(`Failed to delete steering file ${steeringFile}:`, error);
        }
      }
      
      // Delete hook files (quality skills)
      for (const hookFile of pack.hookFiles) {
        try {
          await this.storageManager.deleteHookFile(hookFile);
          console.log(`Deleted quality skill: ${hookFile}`);
        } catch (error) {
          console.error(`Failed to delete hook file ${hookFile}:`, error);
        }
      }
      
      // Delete Kiro IDE hooks (if present)
      if (pack.kiroHookFiles && pack.kiroHookFiles.length > 0) {
        for (const kiroHookFile of pack.kiroHookFiles) {
          try {
            await this.storageManager.deleteKiroHook(kiroHookFile);
            console.log(`Deleted Kiro hook: ${kiroHookFile}`);
          } catch (error) {
            console.error(`Failed to delete Kiro hook ${kiroHookFile}:`, error);
          }
        }
      }
      
      // Delete pack directory from .kiro/steering/
      try {
        await this.storageManager.deletePackDirectory(packName);
        console.log(`Deleted pack directory: ${packName}`);
      } catch (error) {
        console.error(`Failed to delete pack directory ${packName}:`, error);
      }
      
      // Remove from installed packs
      await this.storageManager.removeInstalledPack(packName);
      
      vscode.window.showInformationMessage(`Pack ${packName} uninstalled successfully!`);
      
    } catch (error) {
      console.error(`Failed to uninstall pack ${packName}:`, error);
      throw error;
    }
  }

  /**
   * Refresh packs (check for updates)
   */
  async refreshPacks(): Promise<void> {
    try {
      await this.discoverPacks();
      
      const installedPacks = this.storageManager.getInstalledPacks();
      const updatesAvailable: Pack[] = [];
      
      for (const installedPack of installedPacks) {
        const availablePack = this.availablePacks.find(p => p.name === installedPack.name);
        if (availablePack && availablePack.version !== installedPack.version) {
          updatesAvailable.push(availablePack);
        }
      }
      
      if (updatesAvailable.length > 0) {
        const updateMessage = `${updatesAvailable.length} pack update(s) available. Update now?`;
        const selection = await vscode.window.showInformationMessage(
          updateMessage,
          'Update All',
          'Later'
        );
        
        if (selection === 'Update All') {
          for (const pack of updatesAvailable) {
            await this.installPack(pack); // This will overwrite the existing pack
          }
          vscode.window.showInformationMessage('All packs updated successfully!');
        }
      } else {
        vscode.window.showInformationMessage('All packs are up to date!');
      }
      
    } catch (error) {
      console.error('Failed to refresh packs:', error);
      throw error;
    }
  }

  /**
   * Load installed packs on extension startup
   */
  async loadInstalledPacks(): Promise<void> {
    try {
      const installedPacks = this.storageManager.getInstalledPacks();
      console.log(`Loaded ${installedPacks.length} installed pack(s)`);
      
      // Verify that pack files still exist
      for (const pack of installedPacks) {
        const hookFiles = await this.storageManager.listHookFiles();
        const missingFiles = pack.hookFiles.filter(file => !hookFiles.includes(file));
        
        if (missingFiles.length > 0) {
          console.warn(`Pack ${pack.name} is missing files:`, missingFiles);
          // Could trigger a re-download here
        }
      }
      
    } catch (error) {
      console.error('Failed to load installed packs:', error);
    }
  }

  /**
   * Get installed packs
   */
  getInstalledPacks(): InstalledPack[] {
    return this.storageManager.getInstalledPacks();
  }

  /**
   * Get available packs
   */
  getAvailablePacks(): Pack[] {
    return this.availablePacks;
  }

  /**
   * Clean up all packs
   */
  async cleanupAllPacks(): Promise<void> {
    try {
      await this.storageManager.cleanup();
      await this.storageManager.saveInstalledPacks([]);
      vscode.window.showInformationMessage('All packs cleaned up successfully!');
    } catch (error) {
      console.error('Failed to cleanup packs:', error);
      throw error;
    }
  }
}
