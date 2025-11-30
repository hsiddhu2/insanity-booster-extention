/**
 * Status Bar Integration for Kiro Insights
 */

import * as vscode from 'vscode';
import { KiroAnalyticsService } from '../services/KiroAnalyticsService';

export class InsightsStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(
    private analyticsService: KiroAnalyticsService,
    private context: vscode.ExtensionContext
  ) {
    // Create status bar item (left side, high priority)
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    
    this.statusBarItem.command = 'kiroforge.showInsightsQuickPick';
    this.context.subscriptions.push(this.statusBarItem);
    
    // Initial update
    this.updateStatusBar();
    
    // Auto-update every 60 seconds
    this.startAutoUpdate();
  }

  private async updateStatusBar(): Promise<void> {
    try {
      const analytics = await this.analyticsService.getAnalytics();
      
      // Validate analytics data
      if (!analytics || !analytics.messages || !analytics.sessions || !analytics.timePatterns) {
        console.warn('[InsightsStatusBar] Invalid analytics data structure');
        this.statusBarItem.text = '$(graph) Kiro Insights';
        this.statusBarItem.tooltip = 'Click to view Kiro productivity analytics';
        this.statusBarItem.show();
        return;
      }
      
      // Compact format with VS Code icons: $(graph) Kiro: 1.19M msgs • 19 chats • Peak 1-2AM
      const peakHour = analytics.timePatterns.peakHour || 0;
      const peakHourEnd = (peakHour + 1) % 24;
      
      const text = [
        '$(graph) Kiro:',
        `${this.formatNumber(analytics.messages.total || 0)} msgs`,
        `${analytics.sessions.totalSessions || 0} chats`,
        `Peak ${this.formatTimeAMPM(peakHour)}-${this.formatTimeAMPM(peakHourEnd)}`
      ].join(' • ');
      
      this.statusBarItem.text = text;
      this.statusBarItem.tooltip = this.createTooltip(analytics);
      this.statusBarItem.show();
      console.log('[InsightsStatusBar] Status bar updated successfully');
    } catch (error) {
      console.error('[InsightsStatusBar] Error updating status bar:', error);
      this.statusBarItem.text = '$(graph) Kiro Insights';
      this.statusBarItem.tooltip = new vscode.MarkdownString('**Kiro Insights**\n\nClick to view productivity analytics\n\n*Error loading data - try refreshing*');
      this.statusBarItem.show();
    }
  }

  private createTooltip(analytics: any): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.isTrusted = true;
    tooltip.supportHtml = false; // Use proper Markdown instead of HTML

    const peakHour = analytics.timePatterns?.peakHour || 0;
    const peakHourEnd = (peakHour + 1) % 24;

    // Create a clean, readable Markdown tooltip that actually works in VS Code
    const content = `
### 📊 Kiro Insights Dashboard

---

#### 💬 Interactions
- **Total:** ${this.formatNumber(analytics.messages?.total || 0)} messages
- **Today:** ${this.formatNumber(analytics.messages?.today || 0)}
- **This Week:** ${this.formatNumber(analytics.messages?.thisWeek || 0)}

#### 🗨️ Activity
- **Chat Sessions:** ${analytics.sessions?.totalSessions || 0}
- **Active Days:** ${analytics.timePatterns?.activeDays || 0}
- **Peak Time:** ${this.formatTimeAMPM(peakHour)}-${this.formatTimeAMPM(peakHourEnd)}

#### 🔧 Productivity
- **Tool Calls:** ${analytics.tools?.totalCalls?.toLocaleString() || '0'}
- **Workspaces:** ${analytics.workspaces?.totalWorkspaces || '0'}
- **Most Active Day:** ${analytics.timePatterns?.peakDay || 'N/A'}

#### ⏰ Work Pattern
- **Working Hours:** ${analytics.timePatterns?.workingHoursPercentage?.toFixed(1) || '0'}%
- **After Hours:** ${analytics.timePatterns?.afterHoursPercentage?.toFixed(1) || '0'}%
- **Consistency Score:** ${analytics.timePatterns?.consistencyScore?.toFixed(0) || '0'}%

---

*✨ Click to see detailed analytics in the sidebar ✨*
    `;

    tooltip.appendMarkdown(content.trim());
    return tooltip;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private formatTimeAMPM(hour: number): string {
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  }

  private startAutoUpdate(): void {
    // Update every 60 seconds
    this.updateInterval = setInterval(() => {
      this.updateStatusBar();
    }, 60000);
  }

  public refresh(): void {
    this.updateStatusBar();
  }

  public dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.statusBarItem.dispose();
  }
}
