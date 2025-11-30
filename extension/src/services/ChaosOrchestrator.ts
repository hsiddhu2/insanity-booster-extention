/**
 * Chaos Orchestrator - Central coordinator for all annoying behaviors
 */

import * as vscode from 'vscode';

export interface EasterEgg {
  trigger: string;
  type: 'notification' | 'sound' | 'visual' | 'modal';
  action: string;
  message?: string;
}

export interface ChaosLevel {
  level: number; // 1-10
  notificationFrequency: number; // per minute
  errorMultiplier: number;
  delayMultiplier: number;
  modalFrequency: number; // per hour
}

export class ChaosOrchestrator {
  private chaosLevel: ChaosLevel;
  private keystrokeCount: number = 0;
  private lastActivityTime: number = Date.now();
  private idleCheckInterval: NodeJS.Timeout | null = null;
  
  // Easter eggs configuration
  private easterEggs: EasterEgg[] = [
    {
      trigger: 'sudo',
      type: 'notification',
      action: 'show',
      message: "Nice try! You're not the boss of me 😎"
    },
    {
      trigger: '// TODO',
      type: 'notification',
      action: 'multiply',
      message: "TODO detected! Adding 10 more TODOs for you 📝"
    },
    {
      trigger: 'git push --force',
      type: 'notification',
      action: 'show',
      message: "⚠️ YOLO MODE ACTIVATED! 🚀"
    },
    {
      trigger: 'rm -rf',
      type: 'notification',
      action: 'show',
      message: "😱 WHOA THERE COWBOY! That's dangerous!"
    },
    {
      trigger: 'console.log',
      type: 'notification',
      action: 'show',
      message: "🚨 CONSOLE.LOG DETECTED! The debugging gods are disappointed in you"
    }
  ];

  constructor() {
    this.chaosLevel = {
      level: 1,
      notificationFrequency: 2,
      errorMultiplier: 1,
      delayMultiplier: 1,
      modalFrequency: 1
    };
  }

  /**
   * Initialize chaos systems
   */
  async initialize(): Promise<void> {
    console.log('🎭 Chaos Orchestrator initialized - Let the madness begin!');
    
    // Start idle monitoring
    this.startIdleMonitoring();
    
    // Gradually increase chaos level over time
    this.startChaosEscalation();
  }

  /**
   * Handle user typing event
   */
  onUserTyping(document: vscode.TextDocument, position: vscode.Position): void {
    this.keystrokeCount++;
    this.lastActivityTime = Date.now();
    
    // Check for Easter eggs in the typed text
    const line = document.lineAt(position.line).text;
    this.checkForEasterEggs(line);
    
    // Trigger notification every 10 keystrokes
    if (this.keystrokeCount % 10 === 0) {
      this.triggerTypingInterruption();
    }
  }

  /**
   * Handle file save event
   */
  onFileSave(document: vscode.TextDocument): void {
    this.lastActivityTime = Date.now();
    
    // Check if it's Friday afternoon
    const now = new Date();
    if (now.getDay() === 5 && now.getHours() >= 15) {
      vscode.window.showInformationMessage("🎉 It's Friday! Why are you still coding?");
    }
  }

  /**
   * Handle file open event
   */
  onFileOpen(document: vscode.TextDocument): void {
    this.lastActivityTime = Date.now();
    
    // Check if filename contains "test"
    if (document.fileName.toLowerCase().includes('test')) {
      vscode.window.showWarningMessage("🧪 Tests? We don't do that here");
    }
  }

  /**
   * Handle idle time
   */
  onIdle(idleTimeMs: number): void {
    if (idleTimeMs > 30000) { // 30 seconds
      vscode.window.showInformationMessage("👀 I'm watching you... Are you napping?");
    }
  }

  /**
   * Handle special keyword detection
   */
  onSpecialKeyword(keyword: string): void {
    const egg = this.easterEggs.find(e => keyword.includes(e.trigger));
    if (egg && egg.message) {
      vscode.window.showWarningMessage(egg.message);
    }
  }

  /**
   * Increase chaos level over time
   */
  increaseChaosLevel(): void {
    if (this.chaosLevel.level < 10) {
      this.chaosLevel.level++;
      this.chaosLevel.notificationFrequency += 0.5;
      this.chaosLevel.errorMultiplier += 0.2;
      this.chaosLevel.delayMultiplier += 0.1;
      this.chaosLevel.modalFrequency += 0.2;
      
      console.log(`🔥 Chaos level increased to ${this.chaosLevel.level}`);
    }
  }

  /**
   * Get current chaos level
   */
  getChaosLevel(): number {
    return this.chaosLevel.level;
  }

  /**
   * Detect Easter eggs in text
   */
  detectEasterEgg(text: string): EasterEgg | null {
    return this.easterEggs.find(egg => text.includes(egg.trigger)) || null;
  }

  /**
   * Private: Check for Easter eggs
   */
  private checkForEasterEggs(text: string): void {
    const egg = this.detectEasterEgg(text);
    if (egg && egg.message) {
      vscode.window.showWarningMessage(egg.message);
    }
  }

  /**
   * Private: Trigger typing interruption
   */
  private triggerTypingInterruption(): void {
    const messages = [
      "Did you mean to type that? 🤔",
      "Bold choice! 💪",
      "Your keyboard is judging you ⌨️",
      "That's definitely one way to do it 🎯",
      "Interesting approach... 🧐",
      "The code gods are watching 👀"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    vscode.window.showInformationMessage(randomMessage);
  }

  /**
   * Private: Start idle monitoring
   */
  private startIdleMonitoring(): void {
    this.idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      if (idleTime > 300000) { // 5 minutes
        this.onIdle(idleTime);
      }
    }, 60000); // Check every minute
  }

  /**
   * Private: Start chaos escalation
   */
  private startChaosEscalation(): void {
    // Increase chaos level every 10 minutes
    setInterval(() => {
      this.increaseChaosLevel();
    }, 600000);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
  }
}
