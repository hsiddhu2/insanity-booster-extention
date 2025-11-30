/**
 * Tree Data Provider for Kiro Insights View
 */

import * as vscode from 'vscode';
import { KiroAnalyticsService } from '../services/KiroAnalyticsService';
import { AnalyticsSummary } from '../models/Analytics';

export class InsightsTreeProvider implements vscode.TreeDataProvider<InsightTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<InsightTreeItem | undefined | null | void> = 
    new vscode.EventEmitter<InsightTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<InsightTreeItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  private analytics: AnalyticsSummary | null = null;
  private loading = false;

  constructor(private analyticsService: KiroAnalyticsService) {
    // Load analytics on initialization
    this.loadAnalytics();
  }

  refresh(): void {
    this.loadAnalytics(true);
  }

  private async loadAnalytics(forceRefresh = false): Promise<void> {
    if (this.loading) {
      return;
    }

    this.loading = true;
    
    try {
      this.analytics = await this.analyticsService.getAnalytics(forceRefresh);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('Failed to load analytics:', error);
      this.analytics = null;
      this._onDidChangeTreeData.fire();
    } finally {
      this.loading = false;
    }
  }

  getTreeItem(element: InsightTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: InsightTreeItem): Promise<InsightTreeItem[]> {
    if (!this.analytics) {
      if (this.loading) {
        return [new InsightTreeItem('Loading analytics...', '', 'info', '⏳')];
      }
      return [new InsightTreeItem('No analytics data available', '', 'info', '📊')];
    }

    if (!element) {
      // Root level - show main sections
      return [
        new InsightTreeItem(
          'Overview',
          '',
          'overview-section',
          '📈',
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new InsightTreeItem(
          'Interactions',
          '',
          'interactions-section',
          '🗨️',
          vscode.TreeItemCollapsibleState.Collapsed
        ),
        new InsightTreeItem(
          'Tool Usage',
          '',
          'tools-section',
          '🔧',
          vscode.TreeItemCollapsibleState.Collapsed
        ),
        new InsightTreeItem(
          'Activity Patterns',
          '',
          'activity-section',
          '⏰',
          vscode.TreeItemCollapsibleState.Collapsed
        ),
        new InsightTreeItem(
          'Kiro Projects',
          `${this.analytics.workspaces.totalWorkspaces} total`,
          'workspaces-section',
          '📁',
          vscode.TreeItemCollapsibleState.Collapsed
        )
      ];
    }

    // Section-specific children
    switch (element.contextValue) {
      case 'overview-section':
        return this.getOverviewItems();
      case 'interactions-section':
        return this.getInteractionItems();
      case 'depth-categories':
        return this.getDepthCategoryItems();
      case 'tools-section':
        return this.getToolItems();
      case 'activity-section':
        return this.getActivityItems();
      case 'hourly-activity':
        return this.getHourlyActivityItems();
      case 'weekly-activity':
        return this.getWeeklyActivityItems();
      case 'daily-activity':
        return this.getDailyActivityItems();
      case 'productivity-insights':
        return this.getProductivityInsightsItems();
      case 'workspaces-section':
        return this.getWorkspaceItems();
      default:
        return [];
    }
  }

  private getOverviewItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { sessions, interactions } = this.analytics;

    return [
      new InsightTreeItem(
        'Avg Prompts/Session',
        `${Math.round(sessions.avgMessagesPerSession)}`,
        'stat',
        '💬',
        vscode.TreeItemCollapsibleState.None,
        `**Average Prompts per Session**\n\n${Math.round(sessions.avgMessagesPerSession).toLocaleString()} prompts per session`
      ),
      new InsightTreeItem(
        'Avg Interactions/Session',
        `${interactions.avgInteractionsPerSession.toFixed(1)}`,
        'stat',
        '🔄',
        vscode.TreeItemCollapsibleState.None,
        `**Average Interactions per Session**\n\n${interactions.avgInteractionsPerSession.toFixed(1)} interactions per session`
      )
    ];
  }



  private getInteractionItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { interactions } = this.analytics;

    return [
      new InsightTreeItem(
        'Avg per Session',
        `${interactions.avgInteractionsPerSession.toFixed(1)} interactions`,
        'stat',
        '📊',
        vscode.TreeItemCollapsibleState.None,
        `**Average Interactions per Session**\n\n${interactions.avgInteractionsPerSession.toFixed(1)} interactions per session`
      ),
      new InsightTreeItem(
        'Avg Messages/Interaction',
        `${interactions.avgMessagesPerInteraction.toFixed(1)} messages`,
        'stat',
        '💬',
        vscode.TreeItemCollapsibleState.None,
        `**Average Messages per Interaction**\n\n${interactions.avgMessagesPerInteraction.toFixed(1)} messages per interaction`
      ),
      new InsightTreeItem(
        'Deepest Session',
        `${interactions.deepestSession.id}... (${this.formatNumber(interactions.deepestSession.interactions)})`,
        'stat',
        '🏆',
        vscode.TreeItemCollapsibleState.None,
        `**Deepest Session**\n\nSession: ${interactions.deepestSession.id}...\n${interactions.deepestSession.interactions.toLocaleString()} interactions`
      ),
      new InsightTreeItem(
        'Session Depth Categories',
        'View breakdown',
        'depth-categories',
        '🎯',
        vscode.TreeItemCollapsibleState.Collapsed,
        'Session depth distribution'
      )
    ];
  }

  private getDepthCategoryItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { sessionDepthCategories } = this.analytics.interactions;
    const totalSessions = this.analytics.sessions.totalSessions;

    return [
      new InsightTreeItem(
        'Shallow (< 50 interactions)',
        `${sessionDepthCategories.shallow} sessions`,
        'stat',
        '🟢',
        vscode.TreeItemCollapsibleState.None,
        `**Shallow Sessions**\n\n${sessionDepthCategories.shallow} sessions with less than 50 interactions\nQuick tasks and simple queries`
      ),
      new InsightTreeItem(
        'Medium (50-199 interactions)',
        `${sessionDepthCategories.medium} sessions`,
        'stat',
        '🟡',
        vscode.TreeItemCollapsibleState.None,
        `**Medium Sessions**\n\n${sessionDepthCategories.medium} sessions with 50-199 interactions\nStandard development work`
      ),
      new InsightTreeItem(
        'Deep (200-499 interactions)',
        `${sessionDepthCategories.deep} sessions`,
        'stat',
        '🟠',
        vscode.TreeItemCollapsibleState.None,
        `**Deep Sessions**\n\n${sessionDepthCategories.deep} sessions with 200-499 interactions\nComplex projects and features`
      ),
      new InsightTreeItem(
        'Very Deep (500+ interactions)',
        `${sessionDepthCategories.veryDeep} sessions`,
        'stat',
        '🔴',
        vscode.TreeItemCollapsibleState.None,
        `**Very Deep Sessions**\n\n${sessionDepthCategories.veryDeep} sessions with 500+ interactions\nMajor development work`
      )
    ];
  }

  private getToolItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { tools } = this.analytics;

    const items: InsightTreeItem[] = [
      new InsightTreeItem(
        'Total Tool Calls',
        `${this.formatNumber(tools.totalCalls)} calls`,
        'stat',
        '🔧',
        vscode.TreeItemCollapsibleState.None,
        `**Total Tool Executions**\n\nAll tool usage across sessions`
      )
    ];

    // Add each tool with visual bar (percentage only)
    tools.topTools.forEach((tool, idx) => {
      const barLength = Math.round(tool.percentage / 5); // Scale to ~20 chars max
      const bar = '█'.repeat(barLength);
      
      items.push(
        new InsightTreeItem(
          `${idx + 1}. ${tool.name}`,
          `${tool.percentage.toFixed(1)}% ${bar}`,
          'stat',
          '▪️',
          vscode.TreeItemCollapsibleState.None,
          `**${tool.name}**\n\n${tool.percentage.toFixed(1)}% of tool usage\nRank: #${idx + 1}`
        )
      );
    });

    return items;
  }

  private getActivityItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { timePatterns, messages } = this.analytics;
    const totalFiles = timePatterns.dailyActivity.reduce((sum, d) => sum + d.files, 0);

    return [
      new InsightTreeItem(
        '═══════════════════════════════════════',
        '',
        'separator',
        '',
        vscode.TreeItemCollapsibleState.None
      ),
      new InsightTreeItem(
        '📈 ACTIVITY STATISTICS',
        '',
        'header',
        '',
        vscode.TreeItemCollapsibleState.None
      ),
      new InsightTreeItem(
        '═══════════════════════════════════════',
        '',
        'separator',
        '',
        vscode.TreeItemCollapsibleState.None
      ),
      new InsightTreeItem(
        'Active Days',
        `${timePatterns.activeDays} days`,
        'stat',
        '📆',
        vscode.TreeItemCollapsibleState.None,
        `**Active Days**\n\n${timePatterns.activeDays} days with activity`
      ),
      new InsightTreeItem(
        'Working Hours (9AM-6PM)',
        `${timePatterns.workingHoursPercentage.toFixed(1)}%`,
        'stat',
        '🌞',
        vscode.TreeItemCollapsibleState.None,
        `**Working Hours Activity**\n\n${timePatterns.workingHoursPercentage.toFixed(1)}% of messages during 9AM-6PM`
      ),
      new InsightTreeItem(
        'After Hours',
        `${timePatterns.afterHoursPercentage.toFixed(1)}%`,
        'stat',
        '🌙',
        vscode.TreeItemCollapsibleState.None,
        `**After Hours Activity**\n\n${timePatterns.afterHoursPercentage.toFixed(1)}% of messages outside 9AM-6PM`
      ),
      new InsightTreeItem(
        'Hourly Activity Pattern',
        'View 24-hour breakdown',
        'hourly-activity',
        '⏰',
        vscode.TreeItemCollapsibleState.Collapsed,
        'Hourly activity distribution across 24 hours'
      ),
      new InsightTreeItem(
        'Weekly Activity Pattern',
        'View by day of week',
        'weekly-activity',
        '📅',
        vscode.TreeItemCollapsibleState.Collapsed,
        'Activity distribution across days of the week'
      ),
      new InsightTreeItem(
        'Daily Activity (Last 30 Days)',
        'View recent activity',
        'daily-activity',
        '📆',
        vscode.TreeItemCollapsibleState.Collapsed,
        'Daily activity for the last 30 days'
      ),
      new InsightTreeItem(
        'Productivity Insights',
        'View top productive times',
        'productivity-insights',
        '💡',
        vscode.TreeItemCollapsibleState.Collapsed,
        'Most productive hours and days'
      )
    ];
  }

  private getHourlyActivityItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { hourlyActivity, peakHour } = this.analytics.timePatterns;
    const totalMessages = hourlyActivity.reduce((sum, h) => sum + h.messages, 0);
    const maxMessages = Math.max(...hourlyActivity.map(h => h.messages));

    return hourlyActivity.map(({ hour, messages, files }) => {
      const percentage = totalMessages > 0 ? (messages / totalMessages) * 100 : 0;
      const barLength = Math.round((messages / maxMessages) * 40);
      const bar = '█'.repeat(barLength);
      const isPeak = hour === peakHour;
      
      return new InsightTreeItem(
        `${hour.toString().padStart(2, '0')}:00`,
        `${bar} ${percentage.toFixed(1)}%${isPeak ? ' 🔥' : ''}`,
        'stat',
        isPeak ? '🔥' : '▪️',
        vscode.TreeItemCollapsibleState.None,
        `**${hour}:00 - ${hour + 1}:00**\n\n${percentage.toFixed(1)}% of activity${isPeak ? '\n\n🔥 Peak Hour!' : ''}`
      );
    });
  }

  private getWeeklyActivityItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { weeklyActivity, peakDay } = this.analytics.timePatterns;
    const totalMessages = weeklyActivity.reduce((sum, d) => sum + d.messages, 0);
    const maxMessages = Math.max(...weeklyActivity.map(d => d.messages));

    return weeklyActivity.map(({ day, messages, files }) => {
      const percentage = totalMessages > 0 ? (messages / totalMessages) * 100 : 0;
      const barLength = Math.round((messages / maxMessages) * 40);
      const bar = '█'.repeat(barLength);
      const isPeak = day === peakDay;
      
      return new InsightTreeItem(
        day,
        `${bar} ${percentage.toFixed(1)}%${isPeak ? ' 🔥' : ''}`,
        'stat',
        isPeak ? '🔥' : '▪️',
        vscode.TreeItemCollapsibleState.None,
        `**${day}**\n\n${percentage.toFixed(1)}% of activity${isPeak ? '\n\n🔥 Most Active Day!' : ''}`
      );
    });
  }

  private getDailyActivityItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { dailyActivity } = this.analytics.timePatterns;
    const totalMessages = dailyActivity.reduce((sum, d) => sum + d.messages, 0);
    const maxMessages = Math.max(...dailyActivity.map(d => d.messages));

    return dailyActivity.map(({ date, dayName, messages, files }) => {
      const percentage = totalMessages > 0 ? (messages / totalMessages) * 100 : 0;
      const barLength = Math.round((messages / maxMessages) * 20);
      const bar = '█'.repeat(barLength);
      
      return new InsightTreeItem(
        `${date} (${dayName})`,
        `${bar} ${percentage.toFixed(1)}%`,
        'stat',
        '▪️',
        vscode.TreeItemCollapsibleState.None,
        `**${date} (${dayName})**\n\n${percentage.toFixed(1)}% of activity`
      );
    });
  }

  private getProductivityInsightsItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { hourlyActivity, topProductiveDays, peakHour } = this.analytics.timePatterns;
    
    // Get top 3 hours
    const topHours = [...hourlyActivity]
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 3);

    // Calculate total messages for percentage
    const totalHourlyMessages = hourlyActivity.reduce((sum, h) => sum + h.messages, 0);
    const totalDailyMessages = topProductiveDays.reduce((sum, d) => sum + d.messages, 0);

    const items: InsightTreeItem[] = [
      new InsightTreeItem(
        'Most Productive Hours',
        '',
        'header',
        '⏰',
        vscode.TreeItemCollapsibleState.None
      )
    ];

    topHours.forEach((hour, idx) => {
      const percentage = totalHourlyMessages > 0 ? (hour.messages / totalHourlyMessages) * 100 : 0;
      items.push(
        new InsightTreeItem(
          `${idx + 1}. ${hour.hour}:00 - ${hour.hour + 1}:00`,
          `${percentage.toFixed(1)}%`,
          'stat',
          '🔥',
          vscode.TreeItemCollapsibleState.None,
          `**#${idx + 1} Most Productive Hour**\n\n${hour.hour}:00 - ${hour.hour + 1}:00\n${percentage.toFixed(1)}% of activity`
        )
      );
    });

    items.push(
      new InsightTreeItem(
        'Most Productive Days',
        '',
        'header',
        '📅',
        vscode.TreeItemCollapsibleState.None
      )
    );

    topProductiveDays.forEach((day, idx) => {
      const percentage = totalDailyMessages > 0 ? (day.messages / totalDailyMessages) * 100 : 0;
      items.push(
        new InsightTreeItem(
          `${idx + 1}. ${day.date} (${day.dayName})`,
          `${percentage.toFixed(1)}%`,
          'stat',
          '🔥',
          vscode.TreeItemCollapsibleState.None,
          `**#${idx + 1} Most Productive Day**\n\n${day.date} (${day.dayName})\n${percentage.toFixed(1)}% of activity`
        )
      );
    });

    return items;
  }

  private getWorkspaceItems(): InsightTreeItem[] {
    if (!this.analytics) return [];

    const { workspaces } = this.analytics.workspaces;

    if (workspaces.length === 0) {
      return [new InsightTreeItem('No Kiro projects found', '', 'info', 'ℹ️')];
    }

    return workspaces.slice(0, 10).map(ws =>
      new InsightTreeItem(
        ws.name,
        ws.path,
        'workspace',
        '📁',
        vscode.TreeItemCollapsibleState.None,
        `**${ws.name}**\n\n${ws.path}\n\nClick to open in VS Code`,
        {
          command: 'kiroforge.openWorkspace',
          title: 'Open Workspace',
          arguments: [ws.path]
        }
      )
    );
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

export class InsightTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly contextValue: string,
    public readonly icon: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    tooltip?: string,
    command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.contextValue = contextValue;
    
    // Set icon - just use emoji in label, no VS Code icon
    if (icon) {
      this.label = `${icon} ${label}`;
    }
    
    // Set tooltip
    if (tooltip) {
      this.tooltip = new vscode.MarkdownString(tooltip);
    }
    
    // Set command
    if (command) {
      this.command = command;
    }
  }
}
