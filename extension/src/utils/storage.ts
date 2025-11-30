/**
 * Local storage utilities for KiroForge extension
 */

import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { InstalledPack } from '../models/Pack';

export class StorageManager {
  private context: vscode.ExtensionContext;
  private workspaceRoot: string;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }

  /**
   * Get the .kiro directory path
   */
  getKiroDir(): string {
    return path.join(this.workspaceRoot, '.kiro');
  }

  /**
   * Get the KiroForge directory path
   */
  getKiroForgeDir(): string {
    return path.join(this.getKiroDir(), 'kiroforge');
  }

  /**
   * Get the steering files directory
   */
  getSteeringDir(): string {
    return path.join(this.getKiroDir(), 'steering');
  }

  /**
   * Get the hooks directory (KiroForge quality skills)
   */
  getHooksDir(): string {
    return path.join(this.getKiroForgeDir(), 'hooks');
  }

  /**
   * Check if workspace is available
   */
  hasWorkspace(): boolean {
    return this.workspaceRoot !== '';
  }

  /**
   * Ensure .kiro directories exist
   */
  async ensureDirectories(): Promise<void> {
    if (!this.hasWorkspace()) {
      throw new Error('No workspace folder open. Please open a folder first.');
    }
    await fs.ensureDir(this.getKiroDir());
    await fs.ensureDir(this.getKiroForgeDir());
    await fs.ensureDir(this.getSteeringDir());
    await fs.ensureDir(this.getHooksDir());
    await fs.ensureDir(this.getKiroHooksDir());  // Kiro IDE hooks directory
  }

  /**
   * Save steering file to .kiro/steering/
   */
  async saveSteeringFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.getSteeringDir(), filename);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Save hook file to .kiro/kiroforge/hooks/
   */
  async saveHookFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.getHooksDir(), filename);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Delete steering file from .kiro/steering/
   */
  async deleteSteeringFile(filename: string): Promise<void> {
    const filePath = path.join(this.getSteeringDir(), filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  /**
   * Delete hook file from .kiro/kiroforge/hooks/
   */
  async deleteHookFile(filename: string): Promise<void> {
    const filePath = path.join(this.getHooksDir(), filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  /**
   * Delete pack directory from .kiro/steering/
   */
  async deletePackDirectory(packName: string): Promise<void> {
    const packDir = path.join(this.getSteeringDir(), packName);
    if (await fs.pathExists(packDir)) {
      await fs.remove(packDir);
    }
  }

  /**
   * Read hook file from .kiro/kiroforge/hooks/
   */
  async readHookFile(filename: string): Promise<string> {
    const filePath = path.join(this.getHooksDir(), filename);
    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * List all hook files
   */
  async listHookFiles(): Promise<string[]> {
    const hooksDir = this.getHooksDir();
    if (!(await fs.pathExists(hooksDir))) {
      return [];
    }
    const files = await fs.readdir(hooksDir);
    return files.filter((file: string) => file.endsWith('.json'));
  }

  /**
   * Get the Kiro IDE hooks directory (.kiro/hooks/)
   */
  getKiroHooksDir(): string {
    return path.join(this.getKiroDir(), 'hooks');
  }

  /**
   * Save Kiro IDE hook file to .kiro/hooks/
   */
  async saveKiroHook(filename: string, content: string): Promise<void> {
    const kiroHooksDir = this.getKiroHooksDir();
    await fs.ensureDir(kiroHooksDir);
    const filePath = path.join(kiroHooksDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Read Kiro IDE hook file from .kiro/hooks/
   */
  async readKiroHook(filename: string): Promise<string> {
    const filePath = path.join(this.getKiroHooksDir(), filename);
    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * Delete Kiro IDE hook file from .kiro/hooks/
   */
  async deleteKiroHook(filename: string): Promise<void> {
    const filePath = path.join(this.getKiroHooksDir(), filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  /**
   * List all Kiro IDE hook files (.kiro.hook extension)
   */
  async listKiroHooks(): Promise<string[]> {
    const kiroHooksDir = this.getKiroHooksDir();
    if (!(await fs.pathExists(kiroHooksDir))) {
      return [];
    }
    const files = await fs.readdir(kiroHooksDir);
    // Filter for .kiro.hook files with kebab-case names
    return files.filter((file: string) => file.endsWith('.kiro.hook') && /^[a-z0-9]+(-[a-z0-9]+)*\.kiro\.hook$/.test(file));
  }

  /**
   * Validate Kiro hook filename format (xxx-xxx.kiro.hook)
   * This validates AFTER the rename from .json to .kiro.hook
   */
  isValidKiroHookFilename(filename: string): boolean {
    // Must match pattern: xxx-xxx.kiro.hook (kebab-case with .kiro.hook extension)
    // Allows multiple hyphens: check-security.kiro.hook, add-documentation.kiro.hook
    return /^[a-z0-9]+(-[a-z0-9]+)*\.kiro\.hook$/.test(filename);
  }

  /**
   * Get installed packs from extension storage
   */
  getInstalledPacks(): InstalledPack[] {
    return this.context.globalState.get('installedPacks', []);
  }

  /**
   * Save installed packs to extension storage
   */
  async saveInstalledPacks(packs: InstalledPack[]): Promise<void> {
    await this.context.globalState.update('installedPacks', packs);
  }

  /**
   * Add installed pack
   */
  async addInstalledPack(pack: InstalledPack): Promise<void> {
    const packs = this.getInstalledPacks();
    const existingIndex = packs.findIndex(p => p.name === pack.name);
    
    if (existingIndex >= 0) {
      packs[existingIndex] = pack;
    } else {
      packs.push(pack);
    }
    
    await this.saveInstalledPacks(packs);
  }

  /**
   * Remove installed pack
   */
  async removeInstalledPack(packName: string): Promise<void> {
    const packs = this.getInstalledPacks();
    const filtered = packs.filter(p => p.name !== packName);
    await this.saveInstalledPacks(filtered);
  }

  /**
   * Check if pack is installed
   */
  isPackInstalled(packName: string): boolean {
    const packs = this.getInstalledPacks();
    return packs.some(p => p.name === packName);
  }

  /**
   * Get workspace project ID (for metrics)
   */
  getProjectId(): string {
    // Use workspace folder name as project ID
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || 'unknown';
    return workspaceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Get developer ID (anonymized)
   */
  getDeveloperId(): string {
    // Use a hash of the workspace path for anonymity
    const workspacePath = this.workspaceRoot;
    return Buffer.from(workspacePath).toString('base64').substring(0, 12);
  }

  /**
   * Get value from global state (persists across VS Code sessions)
   */
  async getGlobalState<T>(key: string): Promise<T | undefined> {
    return this.context.globalState.get<T>(key);
  }

  /**
   * Set value in global state (persists across VS Code sessions)
   */
  async setGlobalState<T>(key: string, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  /**
   * Get value from workspace state (persists per workspace)
   */
  async getWorkspaceState<T>(key: string): Promise<T | undefined> {
    return this.context.workspaceState.get<T>(key);
  }

  /**
   * Set value in workspace state (persists per workspace)
   */
  async setWorkspaceState<T>(key: string, value: T): Promise<void> {
    await this.context.workspaceState.update(key, value);
  }

  /**
   * Clean up old files
   */
  async cleanup(): Promise<void> {
    // Remove old steering and hook files
    const steeringDir = this.getSteeringDir();
    const hooksDir = this.getHooksDir();
    
    if (await fs.pathExists(steeringDir)) {
      await fs.emptyDir(steeringDir);
    }
    
    if (await fs.pathExists(hooksDir)) {
      await fs.emptyDir(hooksDir);
    }
  }

  /**
   * Remove all KiroForge workspace data
   * - Removes entire .kiro/kiroforge/ directory (KiroForge-specific)
   * - Removes only KiroForge-installed files from .kiro/steering/
   * - Preserves user-created files in .kiro/steering/
   * Note: This does NOT remove .kiro/hooks/ which is used by Kiro IDE's Agent Hooks
   */
  async cleanupWorkspaceData(): Promise<void> {
    // Get installed packs BEFORE removing KiroForge directory
    const installedPacks = this.getInstalledPacks();
    let removedSteeringCount = 0;
    let removedHookCount = 0;
    let removedDirCount = 0;
    
    // Remove KiroForge-installed files FIRST (before removing .kiro/kiroforge/)
    for (const pack of installedPacks) {
      // Remove hook files from this pack (do this BEFORE removing kiroforge dir)
      if (pack.hookFiles && pack.hookFiles.length > 0) {
        for (const hookFile of pack.hookFiles) {
          try {
            const hookPath = path.join(this.getKiroForgeDir(), 'hooks', hookFile);
            if (await fs.pathExists(hookPath)) {
              await fs.remove(hookPath);
              removedHookCount++;
              console.log(`Removed KiroForge hook file: ${hookFile}`);
            }
          } catch (error) {
            console.error(`Failed to remove hook file ${hookFile}:`, error);
          }
        }
      }
      
      // Remove steering files from this pack
      for (const steeringFile of pack.steeringFiles) {
        try {
          await this.deleteSteeringFile(steeringFile);
          removedSteeringCount++;
          console.log(`Removed KiroForge steering file: ${steeringFile}`);
        } catch (error) {
          console.error(`Failed to remove steering file ${steeringFile}:`, error);
        }
      }
      
      // Remove pack directory from .kiro/steering/
      try {
        const packDir = path.join(this.getSteeringDir(), pack.name);
        if (await fs.pathExists(packDir)) {
          await fs.remove(packDir);
          removedDirCount++;
          console.log(`Removed KiroForge pack directory: ${pack.name}`);
        }
      } catch (error) {
        console.error(`Failed to remove pack directory ${pack.name}:`, error);
      }
    }
    
    console.log(`Removed ${removedSteeringCount} steering file(s), ${removedHookCount} hook file(s), and ${removedDirCount} pack director(ies)`);
    
    // NOW remove entire KiroForge directory (after removing individual files)
    const kiroForgeDir = this.getKiroForgeDir();
    if (await fs.pathExists(kiroForgeDir)) {
      await fs.remove(kiroForgeDir);
      console.log('KiroForge data removed:', kiroForgeDir);
    }
    
    // Clear installed packs state
    await this.saveInstalledPacks([]);
  }
}
