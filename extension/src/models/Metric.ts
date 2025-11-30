/**
 * Metrics data models
 */

export interface Metric {
  projectId: string;
  timestamp: string;
  developerId: string;
  filePath: string;
  ruleId: string;
  violationCount: number;
  team?: string;
  metricType?: MetricType;
  additionalData?: Record<string, any>;
}

export type MetricType = 'hook_violation' | 'steering_usage' | 'ai_operation' | 'pack_install';

export interface SteeringUsageMetric {
  projectId: string;
  timestamp: string;
  developerId: string;
  steeringFile: string;
  operation: string; // 'code_generation', 'suggestion', 'completion'
  context: string;
  effectiveness?: number; // 1-5 rating
}

export interface HookViolationMetric {
  projectId: string;
  timestamp: string;
  developerId: string;
  filePath: string;
  hookId: string;
  severity: string;
  fixed: boolean;
  fixTime?: number; // seconds to fix
}

export interface PackInstallMetric {
  projectId: string;
  timestamp: string;
  developerId: string;
  packName: string;
  packVersion: string;
  installTime: number; // seconds
  success: boolean;
}

export interface MetricsBatch {
  metrics: Metric[];
  batchId: string;
  timestamp: string;
  source: 'kiroforge-extension';
}

export interface MetricsConfig {
  apiUrl: string;
  apiKey: string;
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  enabled: boolean;
}
