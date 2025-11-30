/**
 * Team Detection Utility
 * Detects team information from Git config or VS Code settings
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TeamDetector {
  private cachedTeam?: string;

  /**
   * Get team name for current workspace
   * Priority:
   * 1. VS Code setting (kiroforge.teamName)
   * 2. Git config (team.name)
   * 3. Git remote URL parsing
   * 4. Default to "default-team"
   */
  async getTeamName(): Promise<string> {
    // Return cached value if available
    if (this.cachedTeam) {
      return this.cachedTeam;
    }

    // 1. Check VS Code settings
    const vsConfig = vscode.workspace.getConfiguration('kiroforge');
    const configTeam = vsConfig.get<string>('teamName');
    if (configTeam) {
      this.cachedTeam = configTeam;
      return configTeam;
    }

    // 2. Check Git config for custom team.name
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        const { stdout } = await execAsync('git config team.name', {
          cwd: workspaceFolder.uri.fsPath
        });
        const gitTeam = stdout.trim();
        if (gitTeam) {
          this.cachedTeam = gitTeam;
          return gitTeam;
        }
      }
    } catch (error) {
      // Git config not set, continue to next method
    }

    // 3. Parse Git remote URL
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        const { stdout } = await execAsync('git config --get remote.origin.url', {
          cwd: workspaceFolder.uri.fsPath
        });
        const remoteUrl = stdout.trim();
        const team = this.parseTeamFromGitUrl(remoteUrl);
        if (team) {
          this.cachedTeam = team;
          return team;
        }
      }
    } catch (error) {
      // No Git remote, continue to default
    }

    // 4. Default team
    this.cachedTeam = 'default-team';
    return this.cachedTeam;
  }

  /**
   * Parse team name from Git remote URL
   * Examples:
   * - https://github.com/myorg/myrepo.git → "myorg"
   * - git@github.com:myorg/myrepo.git → "myorg"
   */
  private parseTeamFromGitUrl(url: string): string | null {
    // HTTPS format: https://github.com/org/repo.git
    const httpsMatch = url.match(/https?:\/\/[^\/]+\/([^\/]+)\//);
    if (httpsMatch) {
      return httpsMatch[1];
    }

    // SSH format: git@github.com:org/repo.git
    const sshMatch = url.match(/@[^:]+:([^\/]+)\//);
    if (sshMatch) {
      return sshMatch[1];
    }

    return null;
  }

  /**
   * Clear cached team (useful when config changes)
   */
  clearCache(): void {
    this.cachedTeam = undefined;
  }
}
