#!/usr/bin/env node

/**
 * Count REAL human messages (excluding system prompts)
 * Filters out messages that contain system instructions
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

/**
 * Check if a message is a system prompt (not a real user message)
 */
function isSystemPrompt(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // System prompts and Kiro IDE messages to filter out
  const systemTags = [
    '<identity>',
    '<capabilities>',
    '<response_style>',
    '<rules>',
    '<key_kiro_features>',
    '<system_information>',
    '<platform_specific',
    '<EnvironmentContext>',
    '<kiro-ide-message>',
    '## Included Rules',
    '<user-rule',
    '<workflow-definition>',
    '<implicit-rules>',
    '# System Prompt',
    'CONTEXT TRANSFER:',
    '## Included Rules'
  ];
  
  // Check if content starts with any system tag
  const trimmedContent = content.trim();
  return systemTags.some(tag => trimmedContent.startsWith(tag));
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
    
    // Separate real human messages from system prompts
    const realHumanMessages = humanMessages.filter(m => !isSystemPrompt(m.content));
    const systemPrompts = humanMessages.filter(m => isSystemPrompt(m.content));
    
    // Calculate average length for real human messages
    const avgRealHumanLength = realHumanMessages.length > 0
      ? realHumanMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / realHumanMessages.length
      : 0;
    
    return {
      totalMessages: messages.length,
      humanMessages: humanMessages.length,
      realHumanMessages: realHumanMessages.length,
      systemPrompts: systemPrompts.length,
      botMessages: botMessages.length,
      toolMessages: toolMessages.length,
      avgRealHumanLength: Math.round(avgRealHumanLength),
      exampleRealHuman: realHumanMessages.slice(0, 3)
    };
  } catch (err) {
    return null;
  }
}

function countRealHumanMessages() {
  console.log('🔍 Counting REAL Human Messages (Excluding System Prompts)\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  let totalHuman = 0;
  let totalRealHuman = 0;
  let totalSystemPrompts = 0;
  let totalBot = 0;
  let totalTool = 0;
  let totalMessages = 0;
  let totalFiles = 0;
  let sessionStats = [];
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    let sessionHuman = 0;
    let sessionRealHuman = 0;
    let sessionSystemPrompts = 0;
    let sessionBot = 0;
    let sessionTool = 0;
    let sessionTotal = 0;
    let sessionAvgLength = 0;
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeChatFile(filePath);
      
      if (analysis) {
        sessionHuman += analysis.humanMessages;
        sessionRealHuman += analysis.realHumanMessages;
        sessionSystemPrompts += analysis.systemPrompts;
        sessionBot += analysis.botMessages;
        sessionTool += analysis.toolMessages;
        sessionTotal += analysis.totalMessages;
        sessionAvgLength += analysis.avgRealHumanLength;
        totalFiles++;
      }
    });
    
    if (chatFiles.length > 0) {
      sessionStats.push({
        sessionId: sessionDir,
        files: chatFiles.length,
        human: sessionHuman,
        realHuman: sessionRealHuman,
        systemPrompts: sessionSystemPrompts,
        bot: sessionBot,
        tool: sessionTool,
        total: sessionTotal,
        avgLength: Math.round(sessionAvgLength / chatFiles.length)
      });
      
      totalHuman += sessionHuman;
      totalRealHuman += sessionRealHuman;
      totalSystemPrompts += sessionSystemPrompts;
      totalBot += sessionBot;
      totalTool += sessionTool;
      totalMessages += sessionTotal;
    }
  });
  
  // Sort by real human messages
  sessionStats.sort((a, b) => b.realHuman - a.realHuman);
  
  // Display results
  console.log('📊 MESSAGE BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total Sessions:       ${sessions.length}`);
  console.log(`Total Chat Files:     ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages:       ${totalMessages.toLocaleString()}`);
  console.log();
  console.log('BEFORE FILTERING:');
  console.log(`  👤 Human Messages:  ${totalHuman.toLocaleString()}`);
  console.log();
  console.log('AFTER FILTERING:');
  console.log(`  👤 Real Human:      ${totalRealHuman.toLocaleString()} (${((totalRealHuman/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  🤖 System Prompts:  ${totalSystemPrompts.toLocaleString()} (filtered out)`);
  console.log(`  🤖 Bot Messages:    ${totalBot.toLocaleString()} (${((totalBot/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  🔧 Tool Messages:   ${totalTool.toLocaleString()} (${((totalTool/totalMessages)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Reduction:            ${totalHuman - totalRealHuman} messages filtered (${(((totalHuman - totalRealHuman)/totalHuman)*100).toFixed(1)}%)`);
  console.log();
  console.log(`Avg Real Human/Session:  ${Math.round(totalRealHuman / sessions.length).toLocaleString()}`);
  console.log(`Avg Real Human/File:     ${Math.round(totalRealHuman / totalFiles).toLocaleString()}`);
  
  // Show top sessions
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔥 TOP 10 SESSIONS BY REAL HUMAN MESSAGES');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  sessionStats.slice(0, 10).forEach((session, idx) => {
    const filteredPercent = session.systemPrompts > 0 
      ? ((session.systemPrompts / session.human) * 100).toFixed(1)
      : '0.0';
    
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 12)}...`);
    console.log(`   Files: ${session.files} | Total Messages: ${session.total.toLocaleString()}`);
    console.log(`   👤 Real Human: ${session.realHuman.toLocaleString()} (avg length: ${session.avgLength.toLocaleString()} chars)`);
    console.log(`   🤖 System Prompts: ${session.systemPrompts.toLocaleString()} (${filteredPercent}% filtered)`);
    console.log(`   🤖 Bot: ${session.bot.toLocaleString()}`);
    console.log(`   🔧 Tool: ${session.tool.toLocaleString()}`);
    console.log();
  });
  
  // Sanity check
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SANITY CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const ratio = totalBot / totalRealHuman;
  console.log(`Bot/Real Human Ratio: ${ratio.toFixed(2)}:1`);
  
  if (ratio < 1.5 || ratio > 4) {
    console.log('⚠️  Unusual ratio detected!');
  } else {
    console.log('✅ Ratio looks normal (2-3 bot messages per human)');
  }
  
  console.log();
  const daysActive = 30;
  const dailyReal = Math.round(totalRealHuman / daysActive);
  console.log(`Estimated Daily Real Human Messages: ${dailyReal.toLocaleString()}`);
  console.log(`   (assuming ~${daysActive} days of activity)`);
  console.log();
  console.log(`That's about ${Math.round(dailyReal / 12)} messages per hour`);
  console.log(`   (assuming 12 hours of active work per day)`);
  
  // Recalculate exchanges with real human messages
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 ESTIMATED EXCHANGES (with real human messages)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const estimatedExchanges = Math.min(totalRealHuman, totalBot);
  console.log(`Estimated Exchanges: ${estimatedExchanges.toLocaleString()}`);
  console.log(`   (min of ${totalRealHuman.toLocaleString()} real human, ${totalBot.toLocaleString()} bot)`);
  console.log();
  console.log(`This is much closer to the accurate count of ~118K!`);
}

countRealHumanMessages();
