/**
 * Copyright (c) KiroForge. All rights reserved.
 * Licensed under the MIT License.
 *
 * Hook Registry Service - Handles hook registration and validation
 */

import * as vscode from 'vscode';
import { Hook, HookDefinition, Violation, ValidationResult } from '../models/Hook';
import { StorageManager } from '../utils/storage';
import { MetricsCollector } from './MetricsCollector';
import * as path from 'path';

/**
 * Custom abort error for timeout handling
 */
class AbortError extends Error {
  constructor(message = 'Operation was aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export class HookRegistry {
  private storageManager: StorageManager;
  private metricsCollector?: MetricsCollector;
  private registeredHooks: Map<string, Hook[]> = new Map();
  private diagnosticCollection: vscode.DiagnosticCollection;
  private validationQueue: Map<string, Promise<ValidationResult>> = new Map();
  private maxConcurrentValidations = 3;

  constructor(storageManager: StorageManager, metricsCollector?: MetricsCollector) {
    this.storageManager = storageManager;
    this.metricsCollector = metricsCollector;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('kiroforge');
  }

  /**
   * Set the metrics collector (can be set after construction)
   */
  setMetricsCollector(metricsCollector: MetricsCollector): void {
    this.metricsCollector = metricsCollector;
  }

  /**
   * Register hooks for all installed packs
   */
  async registerInstalledHooks(): Promise<void> {
    try {
      // Clear all registered hooks first
      this.registeredHooks.clear();

      const installedPacks = this.storageManager.getInstalledPacks();

      for (const pack of installedPacks) {
        await this.registerPackHooks(pack.name, pack.hookFiles);
      }
      
    } catch (error) {
      console.error('Failed to register installed hooks:', error);
    }
  }

  /**
   * Register hooks for a specific pack
   */
  async registerPackHooks(packName: string, hookFiles: string[]): Promise<void> {
    try {
      const hooks: Hook[] = [];

      for (const hookFile of hookFiles) {
        const content = await this.storageManager.readHookFile(hookFile);
        const hookDefinition: HookDefinition = JSON.parse(content);
        hooks.push(...hookDefinition.hooks);
      }

      this.registeredHooks.set(packName, hooks);
      
    } catch (error) {
      console.error(`Failed to register hooks for pack ${packName}:`, error);
    }
  }

  /**
   * Validate a document against registered hooks (with throttling)
   */
  async validateDocument(document: vscode.TextDocument): Promise<ValidationResult> {
    const docKey = document.uri.toString();

    // If already validating this document, return existing promise
    if (this.validationQueue.has(docKey)) {
      return this.validationQueue.get(docKey)!;
    }

    // Wait if too many validations running
    while (this.validationQueue.size >= this.maxConcurrentValidations) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create validation promise
    const validationPromise = this._validateDocumentInternal(document);
    this.validationQueue.set(docKey, validationPromise);

    try {
      const result = await validationPromise;
      return result;
    } finally {
      // Remove from queue when done
      this.validationQueue.delete(docKey);
    }
  }

  /**
   * Internal validation logic (called by validateDocument)
   */
  private async _validateDocumentInternal(document: vscode.TextDocument): Promise<ValidationResult> {
    const startTime = Date.now();
    const violations: Violation[] = [];
    const executedHooks: string[] = [];

    try {
      // Skip validation for very large files to prevent performance issues
      const lineCount = document.lineCount;
      const maxLines = vscode.workspace.getConfiguration('kiroforge').get<number>('maxFileSizeForValidation', 5000);

      if (lineCount > maxLines) {
        return {
          filePath: document.fileName,
          violations: [],
          executedHooks: [],
          executionTime: Date.now() - startTime
        };
      }

      // Get file extension
      const fileExtension = path.extname(document.fileName).substring(1);
      const fileName = path.basename(document.fileName);

      // Get all hooks that apply to this file type
      const applicableHooks = this.getApplicableHooks(fileExtension, fileName);

      for (const hook of applicableHooks) {
        // Only execute hooks with onFileSave trigger
        if (hook.trigger === 'onFileSave') {
          executedHooks.push(hook.id);
          const hookViolations = await this.executeHook(hook, document);
          violations.push(...hookViolations);
        }
      }

      // Update diagnostics
      this.updateDiagnostics(document, violations);

      // Send metrics to backend if violations were detected
      // Use fire-and-forget to prevent blocking validation
      if (violations.length > 0 && this.metricsCollector) {
        // Limit metrics to prevent memory issues (max 50 violations per file)
        const metricsToSend = violations.slice(0, 50);

        // Fire and forget - don't await to prevent blocking
        this.sendMetricsAsync(metricsToSend).catch(error => {
          console.error('Failed to collect metrics for violations:', error);
          // Don't fail validation if metrics collection fails
        });

        if (violations.length > 50) {
          console.warn(`Limited metrics to 50 violations (total: ${violations.length}) to prevent memory issues`);
        }
      }

    } catch (error) {
      console.error('Document validation failed:', error);
    }

    const executionTime = Date.now() - startTime;

    return {
      filePath: document.fileName,
      violations,
      executedHooks,
      executionTime
    };
  }

  /**
   * Get hooks applicable to a file type
   */
  private getApplicableHooks(fileExtension: string, fileName: string): Hook[] {
    const applicableHooks: Hook[] = [];

    for (const [, hooks] of this.registeredHooks) {
      for (const hook of hooks) {
        // Check if hook applies to this file type
        if (this.isHookApplicable(hook, fileExtension, fileName)) {
          applicableHooks.push(hook);
        }
      }
    }

    return applicableHooks;
  }

  /**
   * Check if a hook is applicable to a file
   */
  private isHookApplicable(hook: Hook, fileExtension: string, fileName: string): boolean {
    // Check file types
    if (hook.fileTypes.includes('*') || hook.fileTypes.includes(fileExtension)) {
      return true;
    }

    // Check special cases
    if (hook.fileTypes.includes('dockerfile') && fileName.toLowerCase().includes('dockerfile')) {
      return true;
    }

    return false;
  }

  /**
   * Execute a single hook against a document with timeout protection using AbortController
   */
  private async executeHook(hook: Hook, document: vscode.TextDocument): Promise<Violation[]> {
    const content = document.getText();
    const fileName = path.basename(document.fileName);

    // Timeout protection: configurable per hook (default 500ms - reduced for safety)
    const HOOK_TIMEOUT_MS = vscode.workspace.getConfiguration('kiroforge').get<number>('hookTimeout', 500);

    // Create AbortController for proper cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`Hook ${hook.id} timed out after ${HOOK_TIMEOUT_MS}ms on ${document.fileName}`);
    }, HOOK_TIMEOUT_MS);

    try {
      let result: Violation[] = [];

      // Check if already aborted
      if (controller.signal.aborted) {
        return [];
      }

      switch (hook.validation.type) {
        case 'regex':
          result = await this.executeRegexValidation(hook, content, document, controller.signal);
          break;

        case 'filename':
          result = this.executeFilenameValidation(hook, fileName, document);
          break;

        case 'filesize':
          result = this.executeFilesizeValidation(hook, document);
          break;

        case 'ast':
          // AST validation would require a proper parser
          // For now, skip AST validation
          break;
      }

      clearTimeout(timeoutId);
      return result;

    } catch (error: any) {
      clearTimeout(timeoutId);

      // If aborted, return empty array (timeout occurred)
      if (error.name === 'AbortError' || controller.signal.aborted) {
        return [];
      }

      console.error(`Hook execution failed for ${hook.id}:`, error);
      return [];
    }
  }

  /**
   * Execute regex validation with safety limits and abort signal support
   */
  private async executeRegexValidation(
    hook: Hook,
    content: string,
    document: vscode.TextDocument,
    signal: AbortSignal
  ): Promise<Violation[]> {
    const violations: Violation[] = [];

    if (!hook.validation.pattern) {
      return violations;
    }

    // Check if already aborted
    if (signal.aborted) {
      throw new AbortError();
    }

    try {
      // Check for potentially problematic regex patterns
      const pattern = hook.validation.pattern;

      // Skip patterns with nested quantifiers (catastrophic backtracking risk)
      if (/\*.*\*|\+.*\+|\*.*\+|\+.*\*/.test(pattern)) {
        console.warn(`Skipping hook ${hook.id}: pattern has nested quantifiers (catastrophic backtracking risk)`);
        return violations;
      }

      const regex = new RegExp(pattern, 'gm');
      const lines = content.split('\n');

      // Safety limits - VERY conservative to prevent catastrophic backtracking
      const MAX_MATCHES_PER_LINE = 50;
      const MAX_TOTAL_VIOLATIONS = 200;
      const MAX_LINE_LENGTH = 1000;  // Reduced from 5000 - skip very long lines
      const MAX_LINES_TO_PROCESS = 1000;

      const linesToProcess = Math.min(lines.length, MAX_LINES_TO_PROCESS);

      for (let lineIndex = 0; lineIndex < linesToProcess; lineIndex++) {
        // Check abort signal periodically
        if (signal.aborted) {
          throw new AbortError();
        }

        const line = lines[lineIndex];

        // Skip extremely long lines (potential DoS from catastrophic backtracking)
        if (line.length > MAX_LINE_LENGTH) {
          console.warn(`Skipping line ${lineIndex + 1} in ${document.fileName}: too long (${line.length} chars, max: ${MAX_LINE_LENGTH})`);
          continue;
        }

        // Reset regex lastIndex for each line
        regex.lastIndex = 0;

        let matchCount = 0;

        // Use matchAll for safer iteration (prevents infinite loops)
        try {
          // Execute matchAll in a way that can be interrupted
          const matches = Array.from(line.matchAll(regex));

          // Check abort after regex execution
          if (signal.aborted) {
            throw new AbortError();
          }

          for (const match of matches) {
            matchCount++;

            // Limit matches per line
            if (matchCount > MAX_MATCHES_PER_LINE) {
              console.warn(`Too many matches on line ${lineIndex + 1} in ${document.fileName}, stopping at ${MAX_MATCHES_PER_LINE}`);
              break;
            }

            // Limit total violations
            if (violations.length >= MAX_TOTAL_VIOLATIONS) {
              console.warn(`Too many violations in ${document.fileName}, stopping at ${MAX_TOTAL_VIOLATIONS}`);
              return violations;
            }

            violations.push({
              hookId: hook.id,
              message: hook.validation.message,
              severity: hook.severity,
              line: lineIndex + 1,
              column: match.index! + 1,
              filePath: document.fileName,
              ruleType: 'regex',
              timestamp: new Date()
            });
          }
        } catch (matchError: any) {
          // Re-throw abort errors
          if (matchError.name === 'AbortError') {
            throw matchError;
          }
          console.error(`Match iteration failed for hook ${hook.id} on line ${lineIndex + 1}:`, matchError);
          // Continue to next line
          continue;
        }
      }
    } catch (error: any) {
      // Re-throw abort errors
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error(`Regex validation failed for hook ${hook.id}:`, error);
    }

    return violations;
  }

  /**
   * Execute filename validation
   */
  private executeFilenameValidation(hook: Hook, fileName: string, document: vscode.TextDocument): Violation[] {
    const violations: Violation[] = [];

    if (!hook.validation.pattern) {
      return violations;
    }

    try {
      const regex = new RegExp(hook.validation.pattern);

      if (!regex.test(fileName)) {
        violations.push({
          hookId: hook.id,
          message: hook.validation.message,
          severity: hook.severity,
          line: 1,
          column: 1,
          filePath: document.fileName,
          ruleType: 'filename',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error(`Filename validation failed for hook ${hook.id}:`, error);
    }

    return violations;
  }

  /**
   * Execute filesize validation
   */
  private executeFilesizeValidation(hook: Hook, document: vscode.TextDocument): Violation[] {
    const violations: Violation[] = [];

    if (!hook.validation.maxSize) {
      return violations;
    }

    const fileSizeKB = Buffer.byteLength(document.getText(), 'utf8') / 1024;

    if (fileSizeKB > hook.validation.maxSize) {
      violations.push({
        hookId: hook.id,
        message: hook.validation.message.replace('{size}', fileSizeKB.toFixed(2)),
        severity: hook.severity,
        line: 1,
        column: 1,
        filePath: document.fileName,
        ruleType: 'filesize',
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Update VS Code diagnostics
   */
  private updateDiagnostics(document: vscode.TextDocument, violations: Violation[]): void {
    if (violations.length === 0) {
      // Clear diagnostics if no violations found
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = violations.map(violation => {
      const range = new vscode.Range(
        violation.line - 1,
        violation.column - 1,
        violation.line - 1,
        violation.column + 10 // Highlight a few characters
      );
      
      const severity = this.mapSeverity(violation.severity);
      const diagnostic = new vscode.Diagnostic(range, violation.message, severity);
      diagnostic.source = 'KiroForge';
      diagnostic.code = violation.hookId;

      return diagnostic;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Clear diagnostics for a specific file
   */
  clearFileDiagnostics(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Map violation severity to VS Code severity
   */
  private mapSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'info':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  /**
   * Show issues panel
   */
  async showIssuesPanel(): Promise<void> {
    // Show the Problems panel
    vscode.commands.executeCommand('workbench.action.problems.focus');
  }

  /**
   * Send metrics asynchronously (fire and forget)
   */
  private async sendMetricsAsync(violations: Violation[]): Promise<void> {
    if (!this.metricsCollector) {
      return;
    }

    try {
      // Send metrics in batches to prevent overwhelming the queue
      const batchSize = 10;
      for (let i = 0; i < violations.length; i += batchSize) {
        const batch = violations.slice(i, i + batchSize);

        // Send batch without awaiting individual metrics
        await Promise.all(
          batch.map(violation =>
            this.metricsCollector!.collectViolationMetric(violation)
          )
        );
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Silently fail - don't impact validation
    }
  }

  /**
   * Get all violations
   */
  getAllViolations(): Violation[] {
    // This would require tracking violations across all documents
    // For now, return empty array
    return [];
  }

  /**
   * Clear all diagnostics
   */
  clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }
}
