/**
 * Copyright (c) 2024 KiroForge
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license information
 */

/**
 * Kiro IDE Agent Hook models
 */

/**
 * Kiro IDE Agent Hook definition
 */
export interface KiroHook {
  name: string;
  description: string;
  trigger: {
    type: 'manual' | 'onFileSave' | 'onSessionStart' | 'onMessage';
    icon?: string;
    label?: string;
  };
  prompt: string;
  context: string[];  // e.g., ["#File", "#Folder", "#Codebase"]
  autoRun: boolean;
}

/**
 * Kiro Hook file definition (stored in .kiro/hooks/)
 * This matches the format of .kiro.hook files
 */
export interface KiroHookFile {
  name: string;
  description: string;
  trigger: {
    type: string;
    icon?: string;
    label?: string;
  };
  prompt: string;
  context: string[];
  autoRun: boolean;
}
