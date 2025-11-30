/**
 * Analytics Data Models
 */

export interface MessageCounts {
  total: number;
  human: number;
  bot: number;
  tool: number;
  today: number;
  todayHuman: number;
  todayBot: number;
  yesterday: number;
  yesterdayHuman: number;
  yesterdayBot: number;
  thisWeek: number;
  thisWeekHuman: number;
  thisWeekBot: number;
  thisMonth: number;
  thisMonthHuman: number;
  thisMonthBot: number;
}

export interface InteractionMetrics {
  totalInteractions: number;
  avgInteractionsPerSession: number;
  avgMessagesPerInteraction: number;
  deepestSession: {
    id: string;
    interactions: number;
    messages: number;
  };
  sessionDepthCategories: {
    shallow: number;    // < 50 interactions
    medium: number;     // 50-199 interactions
    deep: number;       // 200-499 interactions
    veryDeep: number;   // 500+ interactions
  };
}

export interface ToolUsageStats {
  totalCalls: number;
  toolBreakdown: {
    [toolName: string]: {
      count: number;
      percentage: number;
    };
  };
  topTools: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

export interface WorkspaceActivity {
  totalWorkspaces: number;
  workspaces: Array<{
    name: string;
    path: string;
    sessionCount: number;
  }>;
}

export interface TimePattern {
  peakHour: number;
  peakDay: string;
  mostActiveDay: {
    date: string;
    messages: number;
    files: number;
  };
  workingHoursPercentage: number;
  afterHoursPercentage: number;
  consistencyScore: number;
  activeDays: number;
  hourlyActivity: Array<{
    hour: number;
    messages: number;
    files: number;
  }>;
  weeklyActivity: Array<{
    day: string;
    dayIndex: number;
    messages: number;
    files: number;
  }>;
  dailyActivity: Array<{
    date: string;
    dayName: string;
    messages: number;
    files: number;
  }>;
  topProductiveDays: Array<{
    date: string;
    dayName: string;
    messages: number;
    files: number;
  }>;
}

export interface SessionMetrics {
  totalSessions: number;
  avgMessagesPerSession: number;
  avgFilesPerSession: number;
  mostRecentSession: {
    id: string;
    lastActivity: Date;
    messages: number;
    files: number;
  };
}

export interface AnalyticsSummary {
  messages: MessageCounts;
  interactions: InteractionMetrics;
  tools: ToolUsageStats;
  workspaces: WorkspaceActivity;
  timePatterns: TimePattern;
  sessions: SessionMetrics;
  lastUpdated: Date;
}

export interface ChatFileData {
  session: string;
  file: string;
  totalMessages: number;
  humanMessages: number;
  botMessages: number;
  toolMessages: number;
  lastModified: Date;
  fileSize: number;
}

export interface SessionData {
  sessionId: string;
  chatFiles: number;
  totalMessages: number;
  humanMessages: number;
  realHumanMessages: number;
  systemPrompts: number;
  botMessages: number;
  toolMessages: number;
  interactions: number;
  lastActivity: Date;
  totalSize: number;
}
