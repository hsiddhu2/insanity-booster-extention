/**
 * Metrics Collector Service - Collects and sends metrics to backend API
 */

import * as vscode from 'vscode';
import { Metric, MetricsConfig } from '../models/Metric';
import { Violation } from '../models/Hook';
import { StorageManager } from '../utils/storage';
import { httpClient } from '../utils/http';
import { TeamDetector } from '../utils/teamDetector';

interface QueuedMetric extends Metric {
  retryCount: number;
  lastAttempt?: string;
  queuedAt: string;
}

export class MetricsCollector {
  private storageManager: StorageManager;
  private teamDetector: TeamDetector;
  private metricsQueue: Metric[] = [];
  private offlineQueue: QueuedMetric[] = [];
  private flushTimer?: NodeJS.Timeout;
  private retryTimer?: NodeJS.Timeout;
  private config: MetricsConfig;
  private isOnline = true;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly RETRY_INTERVALS = [5 * 60 * 1000, 10 * 60 * 1000, 20 * 60 * 1000, 60 * 60 * 1000]; // 5min, 10min, 20min, 60min

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    this.teamDetector = new TeamDetector();
    
    // Load configuration
    const vsConfig = vscode.workspace.getConfiguration('kiroforge');
    this.config = {
      apiUrl: vsConfig.get('apiUrl', ''),
      apiKey: vsConfig.get('apiKey', ''),
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      retryAttempts: 3,
      enabled: vsConfig.get('enableMetrics', true)
    };

    // Load persisted offline queue
    this.loadOfflineQueue();

    // Start flush timer
    if (this.config.enabled) {
      this.startFlushTimer();
      this.startRetryTimer();
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Start retry timer for offline queue
   */
  private startRetryTimer(): void {
    // Check offline queue every 5 minutes
    this.retryTimer = setInterval(() => {
      this.processOfflineQueue();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop retry timer
   */
  private stopRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  /**
   * Load offline queue from persistent storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await this.storageManager.getGlobalState<QueuedMetric[]>('offlineMetricsQueue');
      if (stored && Array.isArray(stored)) {
        this.offlineQueue = stored;
        console.log(`Loaded ${this.offlineQueue.length} metrics from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to persistent storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await this.storageManager.setGlobalState('offlineMetricsQueue', this.offlineQueue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add metrics to offline queue
   */
  private async addToOfflineQueue(metrics: Metric[]): Promise<void> {
    const now = new Date().toISOString();
    
    for (const metric of metrics) {
      // Check queue size limit
      if (this.offlineQueue.length >= this.MAX_QUEUE_SIZE) {
        console.warn('Offline queue full, dropping oldest metric');
        this.offlineQueue.shift(); // Remove oldest
      }

      const queuedMetric: QueuedMetric = {
        ...metric,
        retryCount: 0,
        queuedAt: now
      };

      this.offlineQueue.push(queuedMetric);
    }

    await this.saveOfflineQueue();
    console.log(`Added ${metrics.length} metrics to offline queue (total: ${this.offlineQueue.length})`);
  }

  /**
   * Process offline queue with exponential backoff
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing offline queue (${this.offlineQueue.length} metrics)`);

    const now = Date.now();
    const metricsToRetry: QueuedMetric[] = [];
    const metricsToKeep: QueuedMetric[] = [];

    // Determine which metrics are ready for retry
    for (const metric of this.offlineQueue) {
      const retryInterval = this.RETRY_INTERVALS[Math.min(metric.retryCount, this.RETRY_INTERVALS.length - 1)];
      const lastAttemptTime = metric.lastAttempt ? new Date(metric.lastAttempt).getTime() : new Date(metric.queuedAt).getTime();
      const timeSinceLastAttempt = now - lastAttemptTime;

      if (timeSinceLastAttempt >= retryInterval) {
        metricsToRetry.push(metric);
      } else {
        metricsToKeep.push(metric);
      }
    }

    if (metricsToRetry.length === 0) {
      return;
    }

    console.log(`Retrying ${metricsToRetry.length} metrics from offline queue`);

    // Try to send metrics in batches of 10
    const batchSize = 10;
    for (let i = 0; i < metricsToRetry.length; i += batchSize) {
      const batch = metricsToRetry.slice(i, i + batchSize);
      
      // Strip queue-specific fields before sending
      const cleanMetrics: Metric[] = batch.map(queuedMetric => {
        const { retryCount, lastAttempt, queuedAt, ...cleanMetric } = queuedMetric;
        return cleanMetric as Metric;
      });
      
      try {
        await httpClient.sendMetricsBatch(cleanMetrics);
        console.log(`Successfully sent ${batch.length} metrics from offline queue`);
        // Don't add to metricsToKeep - successfully sent
      } catch (error) {
        console.error('Failed to send offline metrics batch:', error);
        
        // Update retry count and last attempt time
        for (const metric of batch) {
          metric.retryCount++;
          metric.lastAttempt = new Date().toISOString();
          
          // Keep if under max retry attempts (using RETRY_INTERVALS length as max)
          if (metric.retryCount < this.RETRY_INTERVALS.length) {
            metricsToKeep.push(metric);
          } else {
            console.warn(`Dropping metric after ${metric.retryCount} retry attempts`);
          }
        }
      }
    }

    // Update offline queue
    this.offlineQueue = metricsToKeep;
    await this.saveOfflineQueue();
    
    if (this.offlineQueue.length === 0) {
      console.log('Offline queue cleared successfully');
      this.isOnline = true;
    }
  }

  /**
   * Collect hook violation metric
   */
  async collectViolationMetric(violation: Violation): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const team = await this.teamDetector.getTeamName();

    const metric: Metric = {
      projectId: this.storageManager.getProjectId(),
      timestamp: new Date().toISOString(),
      developerId: this.storageManager.getDeveloperId(),
      filePath: violation.filePath,
      ruleId: violation.hookId,
      violationCount: 1,
      team: team,
      metricType: 'hook_violation',
      additionalData: {
        severity: violation.severity,
        ruleType: violation.ruleType,
        message: violation.message
      }
    };

    this.queueMetric(metric);
  }

  /**
   * Collect steering usage metric
   */
  async collectSteeringUsageMetric(steeringFile: string, operation: string, context: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const team = await this.teamDetector.getTeamName();

    const metric: Metric = {
      projectId: this.storageManager.getProjectId(),
      timestamp: new Date().toISOString(),
      developerId: this.storageManager.getDeveloperId(),
      filePath: steeringFile,
      ruleId: 'steering-usage',
      violationCount: 0,
      team: team,
      metricType: 'steering_usage',
      additionalData: {
        operation,
        context
      }
    };

    this.queueMetric(metric);
  }

  /**
   * Collect pack installation metric
   */
  async collectPackInstallMetric(packName: string, packVersion: string, installTime: number, success: boolean): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const team = await this.teamDetector.getTeamName();

    const metric: Metric = {
      projectId: this.storageManager.getProjectId(),
      timestamp: new Date().toISOString(),
      developerId: this.storageManager.getDeveloperId(),
      filePath: packName,
      ruleId: 'pack-install',
      violationCount: 0,
      team: team,
      metricType: 'pack_install',
      additionalData: {
        packVersion,
        installTime,
        success
      }
    };

    this.queueMetric(metric);
  }

  /**
   * Queue a metric for sending
   */
  private queueMetric(metric: Metric): void {
    // Safety limit: prevent unbounded queue growth
    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('Metrics queue full, dropping metric to prevent memory leak');
      return;
    }

    this.metricsQueue.push(metric);

    // If queue is full, flush immediately
    if (this.metricsQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queued metrics to backend
   */
  async flush(): Promise<void> {
    if (this.metricsQueue.length === 0) {
      return;
    }

    const metricsToSend = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      await httpClient.sendMetricsBatch(metricsToSend);
      console.log(`Sent ${metricsToSend.length} metrics to backend`);
      this.isOnline = true;
      
      // If we're back online, try to process offline queue
      if (this.offlineQueue.length > 0) {
        console.log('Connection restored, processing offline queue');
        await this.processOfflineQueue();
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
      this.isOnline = false;
      
      // Add failed metrics to offline queue
      await this.addToOfflineQueue(metricsToSend);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(): void {
    const vsConfig = vscode.workspace.getConfiguration('kiroforge');
    this.config.enabled = vsConfig.get('enableMetrics', true);
    this.config.apiUrl = vsConfig.get('apiUrl', '');
    this.config.apiKey = vsConfig.get('apiKey', '');

    // Restart timers if enabled
    if (this.config.enabled) {
      if (!this.flushTimer) {
        this.startFlushTimer();
      }
      if (!this.retryTimer) {
        this.startRetryTimer();
      }
    } else {
      if (this.flushTimer) {
        this.stopFlushTimer();
      }
      if (this.retryTimer) {
        this.stopRetryTimer();
      }
    }
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): { size: number; isOnline: boolean } {
    return {
      size: this.offlineQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Manually trigger offline queue processing
   */
  async retryOfflineQueue(): Promise<void> {
    await this.processOfflineQueue();
  }

  /**
   * Clear offline queue (for testing or manual intervention)
   */
  async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
    console.log('Offline queue cleared manually');
  }

  /**
   * Cleanup on extension deactivation
   */
  async cleanup(): Promise<void> {
    this.stopFlushTimer();
    this.stopRetryTimer();
    await this.flush();
    // Save any remaining offline queue
    await this.saveOfflineQueue();
  }
}
