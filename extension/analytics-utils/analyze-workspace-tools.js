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
    decoded: decodeWorkspacePath(encoded)
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

// Analyze tool usage in a chat file
function analyzeToolUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const messages = data.chat;
    const stats = fs.statSync(filePath);
    
    // Extract tool usage from tool messages
    const toolMessages = messages.filter(m => m.role === 'tool');
    const toolUsage = {};
    
    toolMessages.forEach(msg => {
      const content = msg.content || '';
      
      // Try to detect tool types from content
      if (content.includes('executeBash') || content.includes('Exit Code:')) {
        toolUsage.executeBash = (toolUsage.executeBash || 0) + 1;
      }
      if (content.includes('readFile') || content.includes('Reading')) {
        toolUsage.readFile = (toolUsage.readFile || 0) + 1;
      }
      if (content.includes('fsWrite') || content.includes('Created') || content.includes('writing')) {
        toolUsage.fsWrite = (toolUsage.fsWrite || 0) + 1;
      }
      if (content.includes('strReplace') || content.includes('replaced')) {
        toolUsage.strReplace = (toolUsage.strReplace || 0) + 1;
      }
      if (content.includes('listDirectory') || content.includes('listing')) {
        toolUsage.listDirectory = (toolUsage.listDirectory || 0) + 1;
      }
      if (content.includes('grepSearch') || content.includes('searched')) {
        toolUsage.grepSearch = (toolUsage.grepSearch || 0) + 1;
      }
      if (content.includes('getDiagnostics')) {
        toolUsage.getDiagnostics = (toolUsage.getDiagnostics || 0) + 1;
      }
    });
    
    return {
      totalMessages: messages.length,
      humanMessages: messages.filter(m => m.role === 'human').length,
      botMessages: messages.filter(m => m.role === 'bot').length,
      toolMessages: toolMessages.length,
      toolUsage,
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  } catch (err) {
    return null;
  }
}

// Main analysis function
function analyzeWorkspaceAndTools() {
  console.log('🔍 Analyzing Workspace Activity & Tool Usage...\n');
  
  // Get workspace mappings
  const workspaces = getWorkspaceSessions();
  console.log(`📁 Found ${workspaces.length} workspace directories\n`);
  
  // Get all sessions
  const sessions = getSessionDirectories();
  
  // Analyze each session
  const sessionData = [];
  const globalToolUsage = {};
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    if (chatFiles.length === 0) return;
    
    let sessionStats = {
      sessionId: sessionDir,
      chatFiles: chatFiles.length,
      totalMessages: 0,
      humanMessages: 0,
      botMessages: 0,
      toolMessages: 0,
      toolUsage: {},
      lastActivity: null,
      totalSize: 0
    };
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeToolUsage(filePath);
      
      if (analysis) {
        sessionStats.totalMessages += analysis.totalMessages;
        sessionStats.humanMessages += analysis.humanMessages;
        sessionStats.botMessages += analysis.botMessages;
        sessionStats.toolMessages += analysis.toolMessages;
        sessionStats.totalSize += analysis.fileSize;
        
        // Aggregate tool usage
        Object.entries(analysis.toolUsage).forEach(([tool, count]) => {
          sessionStats.toolUsage[tool] = (sessionStats.toolUsage[tool] || 0) + count;
          globalToolUsage[tool] = (globalToolUsage[tool] || 0) + count;
        });
        
        if (!sessionStats.lastActivity || analysis.lastModified > sessionStats.lastActivity) {
          sessionStats.lastActivity = analysis.lastModified;
        }
      }
    });
    
    sessionData.push(sessionStats);
  });
  
  // Sort by last activity
  sessionData.sort((a, b) => b.lastActivity - a.lastActivity);
  
  // Display workspace breakdown
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📁 WORKSPACE BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  workspaces.forEach((ws, idx) => {
    const projectName = ws.decoded.split('/').pop();
    console.log(`${idx + 1}. ${projectName}`);
    console.log(`   Path: ${ws.decoded}`);
    console.log();
  });
  
  // Display tool usage statistics
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 GLOBAL TOOL USAGE STATISTICS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sortedTools = Object.entries(globalToolUsage)
    .sort((a, b) => b[1] - a[1]);
  
  const totalToolCalls = sortedTools.reduce((sum, [_, count]) => sum + count, 0);
  
  sortedTools.forEach(([tool, count], idx) => {
    const percentage = ((count / totalToolCalls) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`${idx + 1}. ${tool.padEnd(20)} ${count.toLocaleString().padStart(8)} (${percentage}%)`);
    console.log(`   ${bar}`);
  });
  
  console.log(`\nTotal Tool Calls: ${totalToolCalls.toLocaleString()}`);
  
  // Top sessions by tool usage
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔥 TOP 5 SESSIONS BY TOOL USAGE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const topToolSessions = [...sessionData]
    .sort((a, b) => b.toolMessages - a.toolMessages)
    .slice(0, 5);
  
  topToolSessions.forEach((session, idx) => {
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 16)}...`);
    console.log(`   Tool Messages: ${session.toolMessages.toLocaleString()}`);
    console.log(`   Last Active: ${formatDate(session.lastActivity)}`);
    console.log(`   Top Tools Used:`);
    
    const topTools = Object.entries(session.toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    topTools.forEach(([tool, count]) => {
      console.log(`   └─ ${tool}: ${count.toLocaleString()}`);
    });
    console.log();
  });
  
  // Recent session activity with tools
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RECENT SESSION ACTIVITY (Top 5)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  sessionData.slice(0, 5).forEach((session, idx) => {
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 12)}...`);
    console.log(`   Last Active: ${formatDate(session.lastActivity)}`);
    console.log(`   Messages: ${session.totalMessages.toLocaleString()} (👤 ${session.humanMessages} | 🤖 ${session.botMessages} | 🔧 ${session.toolMessages})`);
    console.log(`   Files: ${session.chatFiles} | Size: ${formatBytes(session.totalSize)}`);
    
    if (Object.keys(session.toolUsage).length > 0) {
      console.log(`   Tools Used:`);
      const tools = Object.entries(session.toolUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      tools.forEach(([tool, count]) => {
        console.log(`   └─ ${tool}: ${count}`);
      });
    }
    console.log();
  });
  
  // Tool usage patterns
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 TOOL USAGE PATTERNS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const avgToolsPerSession = sessionData.reduce((sum, s) => sum + s.toolMessages, 0) / sessionData.length;
  const avgToolsPerMessage = sessionData.reduce((sum, s) => sum + s.toolMessages, 0) / 
                             sessionData.reduce((sum, s) => sum + s.totalMessages, 0);
  
  console.log(`Avg Tool Calls/Session:   ${avgToolsPerSession.toFixed(1)}`);
  console.log(`Avg Tool Calls/Message:   ${avgToolsPerMessage.toFixed(2)}`);
  console.log(`Tool Message Ratio:       ${((sessionData.reduce((sum, s) => sum + s.toolMessages, 0) / sessionData.reduce((sum, s) => sum + s.totalMessages, 0)) * 100).toFixed(1)}%`);
  
  // Most productive tool combinations
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('💡 INSIGHTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const mostUsedTool = sortedTools[0];
  const leastUsedTool = sortedTools[sortedTools.length - 1];
  
  console.log(`Most Used Tool: ${mostUsedTool[0]} (${mostUsedTool[1].toLocaleString()} calls)`);
  console.log(`Least Used Tool: ${leastUsedTool[0]} (${leastUsedTool[1].toLocaleString()} calls)`);
  console.log(`Tool Diversity: ${sortedTools.length} different tools used`);
  console.log(`Avg Tools/Session: ${(sortedTools.length / sessionData.length).toFixed(1)} tool types`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Run the analysis
analyzeWorkspaceAndTools();
