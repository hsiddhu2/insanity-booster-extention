/**
 * Steering pack data models
 */

export interface Pack {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  fileCount?: number;
  installed?: boolean;
  installedVersion?: string;
}

export interface PackManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  steeringFiles: SteeringFile[];
  hooks: HookFile[];
  kiroHooks?: KiroHookFile[];  // Optional: Kiro IDE Agent Hooks
}

export interface KiroHookFile {
  file: string;
  title: string;
}

export interface SteeringFile {
  file: string;
  title: string;
  inclusion: 'always' | 'fileMatch' | 'manual';
  fileMatchPattern?: string;
}

export interface HookFile {
  file: string;
  title: string;
  fileTypes: string[];
}

export interface PackIndex {
  steeringPacks: Pack[];
}

export interface InstalledPack {
  name: string;
  version: string;
  installedAt: Date;
  steeringFiles: string[];
  hookFiles: string[];
  kiroHookFiles?: string[];  // Optional: Kiro IDE Agent Hooks
}
