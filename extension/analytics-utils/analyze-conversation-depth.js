#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KIRO_PATH = '/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent';

// Helper to get all hash directories (sessions)
function getSessionDirectories() {
  const items = fs.readdirSync(KIRO_PATH);
  return items.filter(item => {
    const fullPath = path.join(KIRO_PATH, item);
    return fs.statSync(fullPath).isDirectory() && item.match(/^[a-f0-9]{32}$/);
  });
}

// Helper to get all .chat files in a directory
function getChatFiles(sessionDir) {
  const fullPath = path.join(KIRO_PATH, sessionDir);
  try {
    const items = fs.readdirSync(fullPath);
    return items.filter(item => item.endsWith('.chat'));
  } catch (err) {
    return [];
  }
}

// Analyze conversation depth and patterns
function analyzeConversationDepth(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const messages = data.chat;
    const stats = fs.statSync(filePath);
    
    // Calculate conversation exchanges (human-bot pairs)
    let exchanges = 0;
    let currentExchange = { human: false, bot: false };
    
    messages.forEach(msg => {
      if (msg.role === 'human') {
        if (currentExchange.human && currentExchange.bot) {
          exchanges++;
          currentExchange = { human: true, bot: false };
        } else {
          currentExchange.human = true;
        }
      } else if (msg.role === 'bot') {
        if (currentExchange.human) {
          currentExchange.bot = true;
        }
      }
    });
    
    // Count final exchange if complete
    if (currentExchange.human && currentExchange.bot) {
      exchanges++;
    }
    
    // Calculate conversation patterns
    const humanMessages = messages.filter(m => m.role === 'human');
    const botMessages = messages.filter(m => m.role === 'bot');
    const toolMessages = messages.filter(m => m.role === 'tool');
    
    // Calculate average message length
    const avgHumanLength = humanMessages.length > 0 
      ? humanMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / humanMessages.length 
      : 0;
    
    const avgBotLength = botMessages.length > 0
      ? botMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / botMessages.length
      : 0;
    
    // Detect conversation sequences
    let longestHumanStreak = 0;
    let longestBotStreak = 0;
    let currentHumanStreak = 0;
    let currentBotStreak = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'human') {
        currentHumanStreak++;
        currentBotStreak = 0;
        longestHumanStreak = Math.max(longestHumanStreak, currentHumanStreak);
      } else if (msg.role === 'bot') {
        currentBotStreak++;
        currentHumanStreak = 0;
        longestBotStreak = Math.max(longestBotStreak, currentBotStreak);
      } else {
        currentHumanStreak = 0;
        currentBotStreak = 0;
      }
    });
    
    return {
      totalMessages: messages.length,
      humanMessages: humanMessages.length,
      botMessages: botMessages.length,
      toolMessages: toolMessages.length,
      exchanges: exchanges,
      avgHumanLength: Math.round(avgHumanLength),
      avgBotLength: Math.round(avgBotLength),
      longestHumanStreak,
      longestBotStreak,
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  } catch (err) {
    return null;
  }
}

// Main analysis function
function analyzeConversations() {
  console.log('🔍 Analyzing Conversation Depth & Length...\n');
  
  const sessions = getSessionDirectories();
  console.log(`📊 Found ${sessions.length} session directories\n`);
  
  // Analyze each session
  const sessionStats = [];
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    if (chatFiles.length === 0) return;
    
    let sessionData = {
      sessionId: sessionDir,
      chatFiles: chatFiles.length,
      totalMessages: 0,
      totalExchanges: 0,
      humanMessages: 0,
      botMessages: 0,
      toolMessages: 0,
      avgHumanLength: 0,
      avgBotLength: 0,
      maxExchangesInFile: 0,
      lastActivity: null,
      totalSize: 0
    };
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeConversationDepth(filePath);
      
      if (analysis) {
        sessionData.totalMessages += analysis.totalMessages;
        sessionData.totalExchanges += analysis.exchanges;
        sessionData.humanMessages += analysis.humanMessages;
        sessionData.botMessages += analysis.botMessages;
        sessionData.toolMessages += analysis.toolMessages;
        sessionData.avgHumanLength += analysis.avgHumanLength;
        sessionData.avgBotLength += analysis.avgBotLength;
        sessionData.maxExchangesInFile = Math.max(sessionData.maxExchangesInFile, analysis.exchanges);
        sessionData.totalSize += analysis.fileSize;
        
        if (!sessionData.lastActivity || analysis.lastModified > sessionData.lastActivity) {
          sessionData.lastActivity = analysis.lastModified;
        }
      }
    });
    
    // Calculate averages
    if (chatFiles.length > 0) {
      sessionData.avgHumanLength = Math.round(sessionData.avgHumanLength / chatFiles.length);
      sessionData.avgBotLength = Math.round(sessionData.avgBotLength / chatFiles.length);
    }
    
    sessionStats.push(sessionData);
  });
  
  // Sort by last activity
  sessionStats.sort((a, b) => b.lastActivity - a.lastActivity);
  
  // Display results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 CONVERSATION DEPTH BY SESSION (Top 10 Most Recent)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  sessionStats.slice(0, 10).forEach((session, idx) => {
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 12)}...`);
    console.log(`   Last Active: ${formatDate(session.lastActivity)}`);
    console.log(`   Chat Files: ${session.chatFiles} | Total Messages: ${session.totalMessages.toLocaleString()}`);
    console.log(`   Conversation Exchanges: ${session.totalExchanges.toLocaleString()}`);
    console.log(`   └─ Avg Exchanges/File: ${(session.totalExchanges / session.chatFiles).toFixed(1)}`);
    console.log(`   └─ Max Exchanges in Single File: ${session.maxExchangesInFile}`);
    console.log(`   Message Breakdown:`);
    console.log(`   └─ 👤 Human: ${session.humanMessages.toLocaleString()} (avg length: ${session.avgHumanLength.toLocaleString()} chars)`);
    console.log(`   └─ 🤖 Bot: ${session.botMessages.toLocaleString()} (avg length: ${session.avgBotLength.toLocaleString()} chars)`);
    console.log(`   └─ 🔧 Tool: ${session.toolMessages.toLocaleString()}`);
    console.log(`   Storage: ${formatBytes(session.totalSize)}`);
    console.log();
  });
  
  // Overall statistics
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 OVERALL CONVERSATION STATISTICS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const totalMessages = sessionStats.reduce((sum, s) => sum + s.totalMessages, 0);
  const totalExchanges = sessionStats.reduce((sum, s) => sum + s.totalExchanges, 0);
  const totalHuman = sessionStats.reduce((sum, s) => sum + s.humanMessages, 0);
  const totalBot = sessionStats.reduce((sum, s) => sum + s.botMessages, 0);
  const totalTool = sessionStats.reduce((sum, s) => sum + s.toolMessages, 0);
  const totalFiles = sessionStats.reduce((sum, s) => sum + s.chatFiles, 0);
  
  console.log(`Total Sessions:           ${sessionStats.length}`);
  console.log(`Total Chat Files:         ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages:           ${totalMessages.toLocaleString()}`);
  console.log(`Total Exchanges:          ${totalExchanges.toLocaleString()}`);
  console.log(`Avg Exchanges/Session:    ${(totalExchanges / sessionStats.length).toFixed(1)}`);
  console.log(`Avg Messages/Exchange:    ${(totalMessages / totalExchanges).toFixed(1)}`);
  console.log(`Avg Human Msg Length:     ${Math.round(sessionStats.reduce((sum, s) => sum + s.avgHumanLength, 0) / sessionStats.length).toLocaleString()} chars`);
  console.log(`Avg Bot Msg Length:       ${Math.round(sessionStats.reduce((sum, s) => sum + s.avgBotLength, 0) / sessionStats.length).toLocaleString()} chars`);
  
  // Conversation depth categories
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎯 CONVERSATION DEPTH CATEGORIES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const shallow = sessionStats.filter(s => s.totalExchanges < 50);
  const medium = sessionStats.filter(s => s.totalExchanges >= 50 && s.totalExchanges < 200);
  const deep = sessionStats.filter(s => s.totalExchanges >= 200 && s.totalExchanges < 500);
  const veryDeep = sessionStats.filter(s => s.totalExchanges >= 500);
  
  console.log(`Shallow (< 50 exchanges):      ${shallow.length} sessions`);
  console.log(`Medium (50-199 exchanges):     ${medium.length} sessions`);
  console.log(`Deep (200-499 exchanges):      ${deep.length} sessions`);
  console.log(`Very Deep (500+ exchanges):    ${veryDeep.length} sessions`);
  
  // Most engaging sessions
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔥 TOP 5 DEEPEST CONVERSATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const deepest = [...sessionStats]
    .sort((a, b) => b.totalExchanges - a.totalExchanges)
    .slice(0, 5);
  
  deepest.forEach((session, idx) => {
    console.log(`${idx + 1}. ${session.sessionId.substring(0, 16)}...`);
    console.log(`   Exchanges: ${session.totalExchanges.toLocaleString()} | Messages: ${session.totalMessages.toLocaleString()}`);
    console.log(`   Files: ${session.chatFiles} | Last Active: ${formatDate(session.lastActivity)}`);
    console.log(`   Depth Score: ${(session.totalExchanges / session.chatFiles).toFixed(1)} exchanges/file`);
    console.log();
  });
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
analyzeConversations();
