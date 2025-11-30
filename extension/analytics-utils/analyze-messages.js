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

// Parse a chat file and extract metrics
function analyzeChatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    
    return {
      totalMessages: data.chat.length,
      humanMessages: data.chat.filter(m => m.role === 'human').length,
      botMessages: data.chat.filter(m => m.role === 'bot').length,
      toolMessages: data.chat.filter(m => m.role === 'tool').length,
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  } catch (err) {
    return null;
  }
}

// Main analysis function
function analyzeMessages() {
  console.log('🔍 Analyzing Kiro Message Data...\n');
  
  const sessions = getSessionDirectories();
  console.log(`📊 Found ${sessions.length} session directories\n`);
  
  let allChatFiles = [];
  
  // Collect all chat files with their metadata
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeChatFile(filePath);
      
      if (analysis) {
        allChatFiles.push({
          session: sessionDir,
          file: chatFile,
          ...analysis
        });
      }
    });
  });
  
  console.log(`💬 Found ${allChatFiles.length} chat files\n`);
  
  // Sort by last modified date
  allChatFiles.sort((a, b) => b.lastModified - a.lastModified);
  
  // Calculate time periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  // Categorize by time period
  const periods = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  };
  
  allChatFiles.forEach(file => {
    const fileDate = new Date(file.lastModified);
    
    if (fileDate >= today) {
      periods.today.push(file);
    } else if (fileDate >= yesterday) {
      periods.yesterday.push(file);
    } else if (fileDate >= weekAgo) {
      periods.thisWeek.push(file);
    } else if (fileDate >= monthAgo) {
      periods.thisMonth.push(file);
    } else {
      periods.older.push(file);
    }
  });
  
  // Display results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📅 MESSAGE COUNTS BY TIME PERIOD');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  displayPeriod('TODAY', periods.today);
  displayPeriod('YESTERDAY', periods.yesterday);
  displayPeriod('THIS WEEK (Last 7 Days)', periods.thisWeek);
  displayPeriod('THIS MONTH (Last 30 Days)', periods.thisMonth);
  displayPeriod('OLDER', periods.older);
  
  // Overall statistics
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 OVERALL STATISTICS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const totalMessages = allChatFiles.reduce((sum, f) => sum + f.totalMessages, 0);
  const totalHuman = allChatFiles.reduce((sum, f) => sum + f.humanMessages, 0);
  const totalBot = allChatFiles.reduce((sum, f) => sum + f.botMessages, 0);
  const totalTool = allChatFiles.reduce((sum, f) => sum + f.toolMessages, 0);
  const totalSize = allChatFiles.reduce((sum, f) => sum + f.fileSize, 0);
  
  console.log(`Total Chat Files:     ${allChatFiles.length}`);
  console.log(`Total Messages:       ${totalMessages.toLocaleString()}`);
  console.log(`  └─ Human:           ${totalHuman.toLocaleString()} (${((totalHuman/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  └─ Bot:             ${totalBot.toLocaleString()} (${((totalBot/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  └─ Tool:            ${totalTool.toLocaleString()} (${((totalTool/totalMessages)*100).toFixed(1)}%)`);
  console.log(`Total Storage:        ${formatBytes(totalSize)}`);
  console.log(`Avg Messages/File:    ${(totalMessages/allChatFiles.length).toFixed(1)}`);
  console.log(`Avg File Size:        ${formatBytes(totalSize/allChatFiles.length)}`);
  
  // Top 5 most active sessions
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔥 TOP 5 MOST ACTIVE CHAT FILES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const top5 = [...allChatFiles]
    .sort((a, b) => b.totalMessages - a.totalMessages)
    .slice(0, 5);
  
  top5.forEach((file, idx) => {
    console.log(`${idx + 1}. ${file.file.substring(0, 16)}...`);
    console.log(`   Messages: ${file.totalMessages} (👤 ${file.humanMessages} | 🤖 ${file.botMessages} | 🔧 ${file.toolMessages})`);
    console.log(`   Size: ${formatBytes(file.fileSize)} | Modified: ${formatDate(file.lastModified)}`);
    console.log();
  });
}

function displayPeriod(name, files) {
  if (files.length === 0) {
    console.log(`${name}: No activity\n`);
    return;
  }
  
  const totalMessages = files.reduce((sum, f) => sum + f.totalMessages, 0);
  const humanMessages = files.reduce((sum, f) => sum + f.humanMessages, 0);
  const botMessages = files.reduce((sum, f) => sum + f.botMessages, 0);
  const toolMessages = files.reduce((sum, f) => sum + f.toolMessages, 0);
  
  console.log(`${name}:`);
  console.log(`  Chat Files:    ${files.length}`);
  console.log(`  Total Msgs:    ${totalMessages.toLocaleString()}`);
  console.log(`  👤 Human:      ${humanMessages.toLocaleString()}`);
  console.log(`  🤖 Bot:        ${botMessages.toLocaleString()}`);
  console.log(`  🔧 Tool:       ${toolMessages.toLocaleString()}`);
  console.log(`  Avg/File:      ${(totalMessages/files.length).toFixed(1)}`);
  console.log();
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
analyzeMessages();
