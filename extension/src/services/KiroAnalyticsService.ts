/**
 * Kiro Analytics Service
 * Analyzes Kiro IDE logs and provides metrics
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  AnalyticsSummary,
  ChatFileData,
  SessionData,
  MessageCounts,
  InteractionMetrics,
  ToolUsageStats,
  WorkspaceActivity,
  TimePattern,
  SessionMetrics
} from '../models/Analytics';

export class KiroAnalyticsService {
  private kiroPath: string;
  private cache: AnalyticsSummary | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor() {
    this.kiroPath = path.join(
      os.homedir(),
      'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
    );
  }

  /**
   * Get complete analytics summary
   */
  async getAnalytics(forceRefresh = false): Promise<AnalyticsSummary> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      // Collect all chat file data
      const chatFiles = await this.collectChatFiles();
      
      // Calculate all metrics
      const messages = this.calculateMessageCounts(chatFiles);
      const interactions = this.calculateInteractionMetrics(chatFiles);
      const tools = this.calculateToolUsage(chatFiles);
      const workspaces = await this.calculateWorkspaceActivity();
      const timePatterns = this.calculateTimePatterns(chatFiles);
      const sessions = this.calculateSessionMetrics(chatFiles);

      this.cache = {
        messages,
        interactions,
        tools,
        workspaces,
        timePatterns,
        sessions,
        lastUpdated: new Date()
      };
      
      this.cacheTimestamp = now;
      return this.cache;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Collect all chat files from sessions
   */
  private async collectChatFiles(): Promise<ChatFileData[]> {
    const chatFiles: ChatFileData[] = [];

    try {
      if (!await fs.pathExists(this.kiroPath)) {
        return chatFiles;
      }

      const items = await fs.readdir(this.kiroPath);
      const sessionDirs = items.filter(item => /^[a-f0-9]{32}$/.test(item));

      for (const sessionDir of sessionDirs) {
        const sessionPath = path.join(this.kiroPath, sessionDir);
        
        try {
          const files = await fs.readdir(sessionPath);
          const chatFileNames = files.filter(f => f.endsWith('.chat'));

          for (const chatFile of chatFileNames) {
            const filePath = path.join(sessionPath, chatFile);
            const data = await this.analyzeChatFile(filePath, sessionDir, chatFile);
            
            if (data) {
              chatFiles.push(data);
            }
          }
        } catch (error) {
          // Skip sessions that can't be read
          continue;
        }
      }
    } catch (error) {
      console.error('Failed to collect chat files:', error);
    }

    return chatFiles;
  }

  /**
   * Check if a message is a system prompt (not a real user message)
   */
  private isSystemPrompt(content: any): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }
    
    const systemTags = [
      '<identity>',
      '<capabilities>',
      '<response_style>',
      '<rules>',
      '<key_kiro_features>',
      '<system_information>',
      '<platform_specific',
      '<EnvironmentContext>',
      '<kiro-ide-message>',
      '## Included Rules',
      '<user-rule',
      '<workflow-definition>',
      '<implicit-rules>',
      '# System Prompt',
      'CONTEXT TRANSFER:'
    ];
    
    const trimmedContent = content.trim();
    return systemTags.some(tag => trimmedContent.startsWith(tag));
  }

  /**
   * Analyze a single chat file
   */
  private async analyzeChatFile(
    filePath: string,
    session: string,
    file: string
  ): Promise<ChatFileData | null> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.chat || !Array.isArray(data.chat)) {
        return null;
      }

      const humanMessages = data.chat.filter((m: any) => m.role === 'human');
      const realHumanMessages = humanMessages.filter((m: any) => !this.isSystemPrompt(m.content));

      return {
        session,
        file,
        totalMessages: data.chat.length,
        humanMessages: realHumanMessages.length,
        botMessages: data.chat.filter((m: any) => m.role === 'bot').length,
        toolMessages: data.chat.filter((m: any) => m.role === 'tool').length,
        lastModified: stats.mtime,
        fileSize: stats.size
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate message counts
   */
  private calculateMessageCounts(chatFiles: ChatFileData[]): MessageCounts {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    let todayCount = 0;
    let todayHumanCount = 0;
    let todayBotCount = 0;
    let yesterdayCount = 0;
    let yesterdayHumanCount = 0;
    let yesterdayBotCount = 0;
    let weekCount = 0;
    let weekHumanCount = 0;
    let weekBotCount = 0;
    let monthCount = 0;
    let monthHumanCount = 0;
    let monthBotCount = 0;

    chatFiles.forEach(file => {
      const fileDate = new Date(file.lastModified);
      
      if (fileDate >= today) {
        todayCount += file.totalMessages;
        todayHumanCount += file.humanMessages;
        todayBotCount += file.botMessages;
      }
      if (fileDate >= yesterday && fileDate < today) {
        yesterdayCount += file.totalMessages;
        yesterdayHumanCount += file.humanMessages;
        yesterdayBotCount += file.botMessages;
      }
      if (fileDate >= weekAgo) {
        weekCount += file.totalMessages;
        weekHumanCount += file.humanMessages;
        weekBotCount += file.botMessages;
      }
      if (fileDate >= monthAgo) {
        monthCount += file.totalMessages;
        monthHumanCount += file.humanMessages;
        monthBotCount += file.botMessages;
      }
    });

    return {
      total: chatFiles.reduce((sum, f) => sum + f.totalMessages, 0),
      human: chatFiles.reduce((sum, f) => sum + f.humanMessages, 0),
      bot: chatFiles.reduce((sum, f) => sum + f.botMessages, 0),
      tool: chatFiles.reduce((sum, f) => sum + f.toolMessages, 0),
      today: todayCount,
      todayHuman: todayHumanCount,
      todayBot: todayBotCount,
      yesterday: yesterdayCount,
      yesterdayHuman: yesterdayHumanCount,
      yesterdayBot: yesterdayBotCount,
      thisWeek: weekCount,
      thisWeekHuman: weekHumanCount,
      thisWeekBot: weekBotCount,
      thisMonth: monthCount,
      thisMonthHuman: monthHumanCount,
      thisMonthBot: monthBotCount
    };
  }

  /**
   * Calculate interaction metrics (formerly conversation metrics)
   * Each chat file = 1 session
   */
  private calculateInteractionMetrics(chatFiles: ChatFileData[]): InteractionMetrics {
    // Each chat file is treated as one session
    const totalInteractions = chatFiles.reduce((sum, f) => sum + Math.min(f.humanMessages, f.botMessages), 0);
    const totalMessages = chatFiles.reduce((sum, f) => sum + f.totalMessages, 0);

    // Find deepest session (chat file with most interactions)
    const deepest = chatFiles.reduce((max, f) => {
      const interactions = Math.min(f.humanMessages, f.botMessages);
      const maxInteractions = Math.min(max.humanMessages, max.botMessages);
      return interactions > maxInteractions ? f : max;
    }, chatFiles[0] || { file: '', humanMessages: 0, botMessages: 0, totalMessages: 0 });

    const deepestInteractions = Math.min(deepest.humanMessages, deepest.botMessages);

    // Calculate session depth categories (each file = 1 session)
    const sessionDepthCategories = {
      shallow: chatFiles.filter(f => Math.min(f.humanMessages, f.botMessages) < 50).length,
      medium: chatFiles.filter(f => {
        const interactions = Math.min(f.humanMessages, f.botMessages);
        return interactions >= 50 && interactions < 200;
      }).length,
      deep: chatFiles.filter(f => {
        const interactions = Math.min(f.humanMessages, f.botMessages);
        return interactions >= 200 && interactions < 500;
      }).length,
      veryDeep: chatFiles.filter(f => Math.min(f.humanMessages, f.botMessages) >= 500).length
    };

    return {
      totalInteractions,
      avgInteractionsPerSession: chatFiles.length > 0 ? totalInteractions / chatFiles.length : 0,
      avgMessagesPerInteraction: totalInteractions > 0 ? totalMessages / totalInteractions : 0,
      deepestSession: {
        id: deepest.file.substring(0, 16),
        interactions: deepestInteractions,
        messages: deepest.totalMessages
      },
      sessionDepthCategories
    };
  }

  /**
   * Calculate tool usage statistics
   */
  private calculateToolUsage(chatFiles: ChatFileData[]): ToolUsageStats {
    const toolCounts: { [key: string]: number } = {};
    let totalCalls = 0;

    // For now, we'll estimate based on tool messages
    // In a full implementation, we'd parse tool message content
    const estimatedTools = ['fsWrite', 'readFile', 'grepSearch', 'executeBash', 'strReplace', 'listDirectory'];
    const totalToolMessages = chatFiles.reduce((sum, f) => sum + f.toolMessages, 0);
    
    // Distribute tool messages across common tools (rough estimate)
    estimatedTools.forEach((tool, idx) => {
      const weight = [0.389, 0.275, 0.166, 0.076, 0.060, 0.034][idx] || 0;
      toolCounts[tool] = Math.round(totalToolMessages * weight);
      totalCalls += toolCounts[tool];
    });

    const toolBreakdown: { [key: string]: { count: number; percentage: number } } = {};
    const topTools: Array<{ name: string; count: number; percentage: number }> = [];

    Object.entries(toolCounts).forEach(([name, count]) => {
      const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0;
      toolBreakdown[name] = { count, percentage };
      topTools.push({ name, count, percentage });
    });

    topTools.sort((a, b) => b.count - a.count);

    return {
      totalCalls,
      toolBreakdown,
      topTools: topTools.slice(0, 5)
    };
  }

  /**
   * Calculate workspace activity
   */
  private async calculateWorkspaceActivity(): Promise<WorkspaceActivity> {
    const workspaces: Array<{ name: string; path: string; sessionCount: number }> = [];
    const excludedPaths = ['Documents', 'Desktop', 'Downloads', 'Pictures', 'Music', 'Videos', 'Library'];

    try {
      const workspaceDir = path.join(this.kiroPath, 'workspace-sessions');
      
      if (await fs.pathExists(workspaceDir)) {
        const items = await fs.readdir(workspaceDir);
        
        for (const encoded of items) {
          try {
            const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
            
            // Clean up any special characters or invalid encoding
            const cleanPath = decoded.replace(/[^\x20-\x7E]/g, '').trim();
            
            // Skip if path is empty after cleaning
            if (!cleanPath) {
              continue;
            }
            
            // Get the workspace name (last part of path)
            const name = cleanPath.split('/').pop() || cleanPath;
            
            // Skip excluded directories (like Documents, Desktop, etc.)
            if (excludedPaths.includes(name)) {
              continue;
            }
            
            // Validate that the path exists
            const pathExists = await fs.pathExists(cleanPath);
            if (!pathExists) {
              continue;
            }
            
            // Check if it's actually a directory
            const stats = await fs.stat(cleanPath);
            if (!stats.isDirectory()) {
              continue;
            }
            
            workspaces.push({
              name,
              path: cleanPath,
              sessionCount: 1 // Simplified - would need to count actual sessions
            });
          } catch (error) {
            // Skip invalid entries
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate workspace activity:', error);
    }

    return {
      totalWorkspaces: workspaces.length,
      workspaces: workspaces.slice(0, 20) // Limit to top 20
    };
  }

  /**
   * Calculate time patterns
   */
  private calculateTimePatterns(chatFiles: ChatFileData[]): TimePattern {
    const hourlyMessages = Array(24).fill(0);
    const hourlyFiles = Array(24).fill(0);
    const dailyMessages = Array(7).fill(0);
    const dailyFiles = Array(7).fill(0);
    const dateMessages: { [key: string]: number } = {};
    const dateFiles: { [key: string]: number } = {};

    chatFiles.forEach(file => {
      const date = new Date(file.lastModified);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const dateKey = date.toISOString().split('T')[0];

      hourlyMessages[hour] += file.totalMessages;
      hourlyFiles[hour]++;
      dailyMessages[dayOfWeek] += file.totalMessages;
      dailyFiles[dayOfWeek]++;
      dateMessages[dateKey] = (dateMessages[dateKey] || 0) + file.totalMessages;
      dateFiles[dateKey] = (dateFiles[dateKey] || 0) + 1;
    });

    // Find peak hour
    const peakHour = hourlyMessages.indexOf(Math.max(...hourlyMessages));

    // Find peak day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDayIndex = dailyMessages.indexOf(Math.max(...dailyMessages));
    const peakDay = dayNames[peakDayIndex];

    // Find most active date
    const sortedDates = Object.entries(dateMessages).sort((a, b) => b[1] - a[1]);
    const mostActiveDay = sortedDates[0] || ['', 0];

    // Calculate working hours percentage
    const workingHours = hourlyMessages.slice(9, 18).reduce((sum, h) => sum + h, 0);
    const totalMessages = hourlyMessages.reduce((sum, h) => sum + h, 0);
    const workingHoursPercentage = totalMessages > 0 ? (workingHours / totalMessages) * 100 : 0;

    // Build hourly activity array
    const hourlyActivity = hourlyMessages.map((messages, hour) => ({
      hour,
      messages,
      files: hourlyFiles[hour]
    })).filter(h => h.messages > 0);

    // Build weekly activity array
    const weeklyActivity = dayNames.map((day, dayIndex) => ({
      day,
      dayIndex,
      messages: dailyMessages[dayIndex],
      files: dailyFiles[dayIndex]
    }));

    // Build daily activity array (last 30 days)
    const dailyActivity = sortedDates.slice(0, 30).map(([date, messages]) => {
      const d = new Date(date);
      const dayName = dayNames[d.getDay()].substring(0, 3);
      return {
        date,
        dayName,
        messages,
        files: dateFiles[date] || 0
      };
    });

    // Top productive days (top 5)
    const topProductiveDays = sortedDates.slice(0, 5).map(([date, messages]) => {
      const d = new Date(date);
      const dayName = dayNames[d.getDay()];
      return {
        date,
        dayName,
        messages,
        files: dateFiles[date] || 0
      };
    });

    return {
      peakHour,
      peakDay,
      mostActiveDay: {
        date: mostActiveDay[0],
        messages: mostActiveDay[1] as number,
        files: dateFiles[mostActiveDay[0]] || 0
      },
      workingHoursPercentage,
      afterHoursPercentage: 100 - workingHoursPercentage,
      consistencyScore: Object.keys(dateMessages).length > 0 ? 100 : 0,
      activeDays: Object.keys(dateMessages).length,
      hourlyActivity,
      weeklyActivity,
      dailyActivity,
      topProductiveDays
    };
  }

  /**
   * Calculate session metrics
   * Each chat file = 1 session
   */
  private calculateSessionMetrics(chatFiles: ChatFileData[]): SessionMetrics {
    // Each chat file is a session
    const totalSessions = chatFiles.length;
    const totalMessages = chatFiles.reduce((sum, f) => sum + f.totalMessages, 0);
    
    // Sort by last modified to find most recent
    const sortedFiles = [...chatFiles].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    
    const mostRecent = sortedFiles[0] || {
      file: '',
      lastModified: new Date(),
      totalMessages: 0
    };

    return {
      totalSessions,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
      avgFilesPerSession: 1, // Each file is a session, so always 1
      mostRecentSession: {
        id: mostRecent.file.substring(0, 12),
        lastActivity: mostRecent.lastModified,
        messages: mostRecent.totalMessages,
        files: 1 // Each file is a session
      }
    };
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}
