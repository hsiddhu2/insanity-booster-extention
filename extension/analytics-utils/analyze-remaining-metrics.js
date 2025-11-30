#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KIRO_PATH = '/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent';

// Decode base64 workspace path
function decodeWorkspacePath(encoded) {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch (err) {
    return encoded;
  }
}

// Get workspace sessions
function getWorkspaceSessions() {
  const workspaceDir = path.join(KIRO_PATH, 'workspace-sessions');
  
  if (!fs.existsSync(workspaceDir)) {
    return [];
  }
  
  const items = fs.readdirSync(workspaceDir);
  return items.filter(item => {
    const fullPath = path.join(workspaceDir, item);
    return fs.statSync(fullPath).isDirectory();
  }).map(encoded => ({
    encoded,
    decoded: decodeWorkspacePath(encoded),
    projectName: decodeWorkspacePath(encoded).split('/').pop()
  }));
}

// Get all hash directories (sessions)
function getSessionDirectories() {
  const items = fs.readdirSync(KIRO_PATH);
  return items.filter(item => {
    const fullPath = path.join(KIRO_PATH, item);
    return fs.statSync(fullPath).isDirectory() && item.match(/^[a-f0-9]{32}$/);
  });
}

// Get all .chat files in a directory
function getChatFiles(sessionDir) {
  const fullPath = path.join(KIRO_PATH, sessionDir);
  try {
    const items = fs.readdirSync(fullPath);
    return items.filter(item => item.endsWith('.chat'));
  } catch (err) {
    return [];
  }
}

// Analyze editor problems and file operations
function analyzeDetailedMetrics(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    
    // Extract editor problems
    const editorProblems = data.validations?.editorProblems || {};
    const problemCount = Object.keys(editorProblems).length;
    const totalIssues = Object.values(editorProblems).reduce((sum, problems) => {
      return sum + (Array.isArray(problems) ? problems.length : 0);
    }, 0);
    
    // Extract file operations from tool messages
    const toolMessages = data.chat.filter(m => m.role === 'tool');
    const fileOperations = {
      filesRead: new Set(),
      filesWritten: new Set(),
      filesModified: new Set(),
      filesDeleted: new Set()
    };
    
    toolMessages.forEach(msg => {
      const content = msg.content || '';
      
      // Extract file paths from various patterns
      const readMatch = content.match(/Reading.*?['"`]([^'"`]+)['"`]/gi);
      const writeMatch = content.match(/Created.*?['"`]([^'"`]+)['"`]/gi);
      const modifyMatch = content.match(/Modified.*?['"`]([^'"`]+)['"`]/gi);
      const deleteMatch = content.match(/Deleted.*?['"`]([^'"`]+)['"`]/gi);
      
      if (readMatch) {
        readMatch.forEach(m => {
          const path = m.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (path) fileOperations.filesRead.add(path);
        });
      }
      
      if (writeMatch) {
        writeMatch.forEach(m => {
          const path = m.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (path) fileOperations.filesWritten.add(path);
        });
      }
      
      if (modifyMatch) {
        modifyMatch.forEach(m => {
          const path = m.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (path) fileOperations.filesModified.add(path);
        });
      }
      
      if (deleteMatch) {
        deleteMatch.forEach(m => {
          const path = m.match(/['"`]([^'"`]+)['"`]/)?.[1];
          if (path) fileOperations.filesDeleted.add(path);
        });
      }
    });
    
    return {
      totalMessages: data.chat.length,
      humanMessages: data.chat.filter(m => m.role === 'human').length,
      botMessages: data.chat.filter(m => m.role === 'bot').length,
      toolMessages: toolMessages.length,
      editorProblems: {
        filesWithProblems: problemCount,
        totalIssues: totalIssues,
        problemFiles: Object.keys(editorProblems)
      },
      fileOperations: {
        filesRead: Array.from(fileOperations.filesRead),
        filesWritten: Array.from(fileOperations.filesWritten),
        filesModified: Array.from(fileOperations.filesModified),
        filesDeleted: Array.from(fileOperations.filesDeleted)
      },
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  } catch (err) {
    return null;
  }
}

// Main analysis function
function analyzeRemainingMetrics() {
  console.log('🔍 Analyzing Remaining Metrics...\n');
  console.log('1️⃣ Session Counts per Workspace');
  console.log('2️⃣ Editor Problems/Validations');
  console.log('3️⃣ File Operation Tracking\n');
  
  // Get workspaces
  const workspaces = getWorkspaceSessions();
  const sessions = getSessionDirectories();
  
  // Analyze sessions
  const sessionData = [];
  const globalEditorProblems = {
    totalFiles: new Set(),
    totalIssues: 0,
    issuesByFile: {}
  };
  const globalFileOps = {
    filesRead: new Set(),
    filesWritten: new Set(),
    filesModified: new Set(),
    filesDeleted: new Set()
  };
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    if (chatFiles.length === 0) return;
    
    let sessionStats = {
      sessionId: sessionDir,
      chatFiles: chatFiles.length,
      totalMessages: 0,
      editorProblems: { filesWithProblems: 0, totalIssues: 0, problemFiles: [] },
      fileOperations: { filesRead: new Set(), filesWritten: new Set(), filesModified: new Set(), filesDeleted: new Set() },
      lastActivity: null
    };
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeDetailedMetrics(filePath);
      
      if (analysis) {
        sessionStats.totalMessages += analysis.totalMessages;
        sessionStats.editorProblems.filesWithProblems += analysis.editorProblems.filesWithProblems;
        sessionStats.editorProblems.totalIssues += analysis.editorProblems.totalIssues;
        sessionStats.editorProblems.problemFiles.push(...analysis.editorProblems.problemFiles);
        
        // Aggregate file operations
        analysis.fileOperations.filesRead.forEach(f => {
          sessionStats.fileOperations.filesRead.add(f);
          globalFileOps.filesRead.add(f);
        });
        analysis.fileOperations.filesWritten.forEach(f => {
          sessionStats.fileOperations.filesWritten.add(f);
          globalFileOps.filesWritten.add(f);
        });
        analysis.fileOperations.filesModified.forEach(f => {
          sessionStats.fileOperations.filesModified.add(f);
          globalFileOps.filesModified.add(f);
        });
        analysis.fileOperations.filesDeleted.forEach(f => {
          sessionStats.fileOperations.filesDeleted.add(f);
          globalFileOps.filesDeleted.add(f);
        });
        
        // Global editor problems
        analysis.editorProblems.problemFiles.forEach(f => {
          globalEditorProblems.totalFiles.add(f);
        });
        globalEditorProblems.totalIssues += analysis.editorProblems.totalIssues;
        
        if (!sessionStats.lastActivity || analysis.lastModified > sessionStats.lastActivity) {
          sessionStats.lastActivity = analysis.lastModified;
        }
      }
    });
    
    sessionData.push(sessionStats);
  });
  
  // Sort by last activity
  sessionData.sort((a, b) => b.lastActivity - a.lastActivity);
  
  // Display 1: Session counts per workspace
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📁 SESSION COUNTS PER WORKSPACE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Total Workspaces: ${workspaces.length}`);
  console.log(`Total Sessions: ${sessions.length}\n`);
  
  workspaces.forEach((ws, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${ws.projectName}`);
    console.log(`    Path: ${ws.decoded}`);
  });
  
  console.log(`\nAvg Sessions per Workspace: ${(sessions.length / workspaces.length).toFixed(1)}`);
  
  // Display 2: Editor Problems
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('⚠️  EDITOR PROBLEMS & VALIDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Files with Problems:      ${globalEditorProblems.totalFiles.size}`);
  console.log(`Total Issues Found:       ${globalEditorProblems.totalIssues.toLocaleString()}`);
  console.log(`Avg Issues per File:      ${(globalEditorProblems.totalIssues / globalEditorProblems.totalFiles.size).toFixed(1)}`);
  
  // Top sessions with most problems
  const sessionsWithProblems = sessionData
    .filter(s => s.editorProblems.totalIssues > 0)
    .sort((a, b) => b.editorProblems.totalIssues - a.editorProblems.totalIssues)
    .slice(0, 5);
  
  if (sessionsWithProblems.length > 0) {
    console.log('\nTop 5 Sessions with Most Issues:');
    sessionsWithProblems.forEach((session, idx) => {
      console.log(`  ${idx + 1}. ${session.sessionId.substring(0, 16)}... - ${session.editorProblems.totalIssues} issues in ${session.editorProblems.filesWithProblems} files`);
    });
  }
  
  // Display 3: File Operations
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📂 FILE OPERATION TRACKING');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Files Read:               ${globalFileOps.filesRead.size.toLocaleString()}`);
  console.log(`Files Written:            ${globalFileOps.filesWritten.size.toLocaleString()}`);
  console.log(`Files Modified:           ${globalFileOps.filesModified.size.toLocaleString()}`);
  console.log(`Files Deleted:            ${globalFileOps.filesDeleted.size.toLocaleString()}`);
  console.log(`Total Unique Files:       ${new Set([...globalFileOps.filesRead, ...globalFileOps.filesWritten, ...globalFileOps.filesModified, ...globalFileOps.filesDeleted]).size.toLocaleString()}`);
  
  // Most active sessions by file operations
  const mostActiveFileSessions = sessionData
    .map(s => ({
      ...s,
      totalFileOps: s.fileOperations.filesRead.size + s.fileOperations.filesWritten.size + 
                    s.fileOperations.filesModified.size + s.fileOperations.filesDeleted.size
    }))
    .filter(s => s.totalFileOps > 0)
    .sort((a, b) => b.totalFileOps - a.totalFileOps)
    .slice(0, 5);
  
  console.log('\nTop 5 Sessions by File Operations:');
  mostActiveFileSessions.forEach((session, idx) => {
    console.log(`  ${idx + 1}. ${session.sessionId.substring(0, 16)}...`);
    console.log(`     Read: ${session.fileOperations.filesRead.size} | Write: ${session.fileOperations.filesWritten.size} | Modify: ${session.fileOperations.filesModified.size} | Delete: ${session.fileOperations.filesDeleted.size}`);
    console.log(`     Total: ${session.totalFileOps} file operations`);
  });
  
  // Sample of files operated on
  const sampleFiles = Array.from(globalFileOps.filesWritten).slice(0, 10);
  if (sampleFiles.length > 0) {
    console.log('\nSample Files Written (First 10):');
    sampleFiles.forEach((file, idx) => {
      console.log(`  ${idx + 1}. ${file}`);
    });
  }
  
  // Summary statistics
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY STATISTICS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const totalMessages = sessionData.reduce((sum, s) => sum + s.totalMessages, 0);
  const avgFilesPerSession = sessionData.reduce((sum, s) => 
    sum + s.fileOperations.filesRead.size + s.fileOperations.filesWritten.size + 
    s.fileOperations.filesModified.size + s.fileOperations.filesDeleted.size, 0) / sessionData.length;
  
  console.log(`Total Sessions Analyzed:  ${sessionData.length}`);
  console.log(`Total Messages:           ${totalMessages.toLocaleString()}`);
  console.log(`Avg File Ops/Session:     ${avgFilesPerSession.toFixed(1)}`);
  console.log(`Sessions with Problems:   ${sessionsWithProblems.length}`);
  console.log(`Problem Rate:             ${((sessionsWithProblems.length / sessionData.length) * 100).toFixed(1)}%`);
}

// Run the analysis
analyzeRemainingMetrics();
