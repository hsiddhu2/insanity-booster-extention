/**
 * Hook validation data models
 */

export interface Hook {
  id: string;
  name: string;
  description: string;
  trigger: HookTrigger;
  fileTypes: string[];
  validation: ValidationRule;
  severity: Severity;
  autoFix: boolean;
  tags: string[];
}

export type HookTrigger = 'onFileSave' | 'onCodeGeneration' | 'onCommit';

export type Severity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  type: ValidationType;
  pattern?: string;
  message: string;
  maxSize?: number;
  check?: string;
  applyOnlyToTestFiles?: boolean;
}

export type ValidationType = 'regex' | 'filename' | 'ast' | 'filesize';

export interface HookDefinition {
  hooks: Hook[];
}

export interface Violation {
  hookId: string;
  message: string;
  severity: Severity;
  line: number;
  column: number;
  filePath: string;
  ruleType: ValidationType;
  timestamp: Date;
}

export interface ValidationResult {
  filePath: string;
  violations: Violation[];
  executedHooks: string[];
  executionTime: number;
}
