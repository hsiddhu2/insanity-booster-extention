/**
 * HTTP client utilities for KiroForge extension
 */

import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export class HttpClient {
  private client: AxiosInstance;
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('kiroforge');
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'KiroForge-Extension/1.0.0',
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for API key
    this.client.interceptors.request.use((config) => {
      const apiKey = this.config.get<string>('apiKey');
      if (apiKey && config.url?.includes('execute-api')) {
        config.headers['X-API-Key'] = apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('HTTP Error:', error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get pack index from S3
   */
  async getPackIndex(): Promise<any> {
    const packsUrl = this.config.get<string>('packsUrl');
    const url = `${packsUrl}/index.json`;
    
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Get pack manifest from S3
   */
  async getPackManifest(packName: string, version: string): Promise<any> {
    const packsUrl = this.config.get<string>('packsUrl');
    const url = `${packsUrl}/${packName}/${version}/manifest.json`;
    
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Download steering file from S3
   */
  async downloadSteeringFile(packName: string, version: string, filename: string): Promise<string> {
    const packsUrl = this.config.get<string>('packsUrl');
    const url = `${packsUrl}/${packName}/${version}/${filename}`;
    
    const response = await this.client.get(url, {
      headers: {
        'Accept': 'text/markdown, text/plain, */*'
      }
    });
    return response.data;
  }

  /**
   * Download hook file from S3
   */
  async downloadHookFile(packName: string, version: string, filename: string): Promise<any> {
    const packsUrl = this.config.get<string>('packsUrl');
    const url = `${packsUrl}/${packName}/${version}/${filename}`;
    
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Download Kiro IDE hook file from S3
   * Returns JSON content as string
   */
  async downloadKiroHook(packName: string, version: string, filename: string): Promise<string> {
    const packsUrl = this.config.get<string>('packsUrl');
    const url = `${packsUrl}/${packName}/${version}/${filename}`;
    
    const response = await this.client.get(url);
    
    // If response is already a string, return it
    if (typeof response.data === 'string') {
      return response.data;
    }
    
    // If response is an object (axios parsed it), stringify it
    return JSON.stringify(response.data, null, 2);
  }

  /**
   * Send metric to backend API
   * Silently fails if API is unavailable to avoid disrupting user experience
   */
  async sendMetric(metric: any): Promise<void> {
    const apiUrl = this.config.get<string>('apiUrl');
    if (!apiUrl) {
      console.warn('Metrics API URL not configured. Skipping metric submission.');
      return;
    }
    const url = `${apiUrl}/api/metrics`;
    
    try {
      await this.client.post(url, metric);
    } catch (error: any) {
      // Log but don't throw - metrics are optional
      if (error.response) {
        console.warn(`Metrics API error (${error.response.status}): ${error.response.statusText}`);
      } else if (error.request) {
        console.warn('Metrics API unreachable - network error');
      } else {
        console.warn('Metric submission error:', error.message);
      }
    }
  }

  /**
   * Send metrics batch to backend API
   * Silently fails if API is unavailable to avoid disrupting user experience
   */
  async sendMetricsBatch(metrics: any[]): Promise<void> {
    const apiUrl = this.config.get<string>('apiUrl');
    if (!apiUrl) {
      console.warn('Metrics API URL not configured. Skipping metrics submission.');
      return;
    }
    const url = `${apiUrl}/api/metrics`;
    
    // Send metrics one by one (backend expects single metric per request)
    let successCount = 0;
    let failureCount = 0;
    
    for (const metric of metrics) {
      try {
        await this.client.post(url, metric);
        successCount++;
      } catch (error: any) {
        failureCount++;
        // Log detailed error for debugging but don't throw
        if (error.response) {
          console.warn(`Metrics API error (${error.response.status}): ${error.response.statusText}`);
        } else if (error.request) {
          console.warn('Metrics API unreachable - network error');
        } else {
          console.warn('Metrics submission error:', error.message);
        }
      }
    }
    
    // Log summary but don't throw - metrics are optional
    if (failureCount > 0) {
      console.warn(`Metrics: ${successCount} sent, ${failureCount} failed (backend may be unavailable)`);
    } else {
      console.log(`Successfully sent ${successCount} metrics`);
    }
  }

  /**
   * Get dashboard data from backend API
   */
  async getDashboardData(projectId: string, startDate?: string, endDate?: string): Promise<any> {
    const apiUrl = this.config.get<string>('apiUrl');
    let url = `${apiUrl}/api/dashboard/${projectId}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const packsUrl = this.config.get<string>('packsUrl');
      await this.client.get(`${packsUrl}/index.json`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(): void {
    this.config = vscode.workspace.getConfiguration('kiroforge');
  }
}

// Singleton instance
export const httpClient = new HttpClient();
