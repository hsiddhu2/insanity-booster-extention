#!/usr/bin/env node

/**
 * Verify human message count
 * Shows breakdown of human messages to validate the data
 */

const fs = require('fs');
const path = require('path');

const KIRO_PATH = '/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent';

function getSessionDirectories() {
  const items = fs.readdirSync(KIRO_PATH);
  return items.filter(item => {
    const fullPath = path.join(KIRO_PATH, item);
    return fs.statSync(fullPath).isDirectory() && item.match(/^[a-f0-9]{32}$/);
  });
}

function getChatFiles(sessionDir) {
  const fullPath = path.join(KIRO_PATH, sessionDir);
  try {
    const items = fs.readdirSync(fullPath);
    return items.filter(item => item.endsWith('.chat'));
  } catch (err) {
    return [];
  }
}

function analyzeChatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const messages = data.chat;
    const humanMessages = messages.filter(m => m.role === 'human');
    const botMessages = messages.filter(m => m.role === 'bot');
    const toolMessages = messages.filter(m => m.role === 'tool');
    
    // Calculate average human message length
    const avgHumanLength = humanMessages.length > 0
      ? humanMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / humanMessages.length
      : 0;
    
    return {
      totalMessages: messages.length,
      humanMessages: humanMessages.length,
      botMessages: botMessages.length,
      toolMessages: toolMessages.length,
      avgHumanLength: Math.round(avgHumanLength),
      humanMessageObjects: humanMessages.slice(0, 3)  // Keep first 3 for examples
    };
  } catch (err) {
    return null;
  }
}

function verifyHumanMessages() {
  console.log('🔍 Verifying Human Message Count\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  let totalHuman = 0;
  let totalBot = 0;
  let totalTool = 0;
  let totalMessages = 0;
  let totalFiles = 0;
  let sessionStats = [];
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    let sessionHuman = 0;
    let sessionBot = 0;
    let sessionTool = 0;
    let sessionTotal = 0;
    let sessionAvgLength = 0;
    let exampleMessages = [];
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeChatFile(filePath);
      
      if (analysis) {
        sessionHuman += analysis.humanMessages;
        sessionBot += analysis.botMessages;
        sessionTool += analysis.toolMessages;
        sessionTotal += analysis.totalMessages;
        sessionAvgLength += analysis.avgHumanLength;
        totalFiles++;
        
        // Collect example messages from first file
        if (exampleMessages.length === 0 && analysis.humanMessageObjects.length > 0) {
          exampleMessages = analysis.humanMessageObjects;
        }
      }
    });
    
    if (chatFiles.length > 0) {
      sessionStats.push({
        sessionId: sessionDir,
        files: chatFiles.length,
        human: sessionHuman,
        bot: sessionBot,
        tool: sessionTool,
        total: sessionTotal,
        avgLength: Math.round(sessionAvgLength / chatFiles.length),
        examples: exampleMessages
      });
      
      totalHuman += sessionHuman;
      totalBot += sessionBot;
      totalTool += sessionTool;
      totalMessages += sessionTotal;
    }
  });
  
  // Sort by human messages (most active sessions first)
  sessionStats.sort((a, b) => b.human - a.human);
  
  // Display overall stats
  console.log('📊 OVERALL MESSAGE BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total Sessions:       ${sessions.length}`);
  console.log(`Total Chat Files:     ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages:       ${totalMessages.toLocaleString()}`);
  console.log();
  console.log(`👤 Human Messages:    ${totalHuman.toLocaleString()} (${((totalHuman/totalMessages)*100).toFixed(1)}%)`);
  console.log(`🤖 Bot Messages:      ${totalBot.toLocaleString()} (${((totalBot/totalMessages)*100).toFixed(1)}%)`);
  console.log(`🔧 Tool Messages:     ${totalTool.toLocaleString()} (${((totalTool/totalMessages)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Avg Human/Session:    ${Math.round(totalHuman / sessions.length).toLocaleString()}`);
  console.log(`Avg Human/File:       ${Math.round(totalHuman / totalFiles).toLocaleString()}`);
  
  // Show top sessions by human messages
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔥 TOP 10 SESSIONS BY HUMAN MESSAGES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  sessionStats.slice(0, 10).forEach((session, idx) => {
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 12)}...`);
    console.log(`   Files: ${session.files} | Total Messages: ${session.total.toLocaleString()}`);
    console.log(`   👤 Human: ${session.human.toLocaleString()} (avg length: ${session.avgLength.toLocaleString()} chars)`);
    console.log(`   🤖 Bot: ${session.bot.toLocaleString()}`);
    console.log(`   🔧 Tool: ${session.tool.toLocaleString()}`);
    console.log();
  });
  
  // Show example human messages from most active session
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 EXAMPLE HUMAN MESSAGES (from most active session)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (sessionStats.length > 0 && sessionStats[0].examples.length > 0) {
    sessionStats[0].examples.forEach((msg, idx) => {
      const preview = msg.content ? msg.content.substring(0, 200) : '[no content]';
      console.log(`${idx + 1}. Length: ${msg.content?.length || 0} chars`);
      console.log(`   Preview: ${preview}${msg.content?.length > 200 ? '...' : ''}`);
      console.log();
    });
  }
  
  // Sanity check
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SANITY CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const ratio = totalBot / totalHuman;
  console.log(`Bot/Human Ratio: ${ratio.toFixed(2)}:1`);
  
  if (ratio < 1.5 || ratio > 4) {
    console.log('⚠️  Unusual ratio detected!');
    console.log('   Expected: 2-3 bot messages per human message');
  } else {
    console.log('✅ Ratio looks normal (2-3 bot messages per human)');
  }
  
  console.log();
  console.log(`Tool/Human Ratio: ${(totalTool / totalHuman).toFixed(2)}:1`);
  console.log('   (Tool messages are generated by bot actions)');
  
  // Daily average
  console.log();
  const daysActive = 30;  // Approximate
  console.log(`Estimated Daily Human Messages: ${Math.round(totalHuman / daysActive).toLocaleString()}`);
  console.log(`   (assuming ~${daysActive} days of activity)`);
}

verifyHumanMessages();
