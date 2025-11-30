#!/usr/bin/env node

/**
 * Verify all metrics per session
 * Shows comprehensive breakdown to validate our counting
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

function isSystemPrompt(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
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
    
    const realHumanMessages = humanMessages.filter(m => !isSystemPrompt(m.content));
    const systemPrompts = humanMessages.filter(m => isSystemPrompt(m.content));
    
    // Count interactions (sequential human-bot pairs)
    let interactions = 0;
    let currentInteraction = { human: false, bot: false };
    
    messages.forEach(msg => {
      if (msg.role === 'human' && !isSystemPrompt(msg.content)) {
        if (currentInteraction.human && currentInteraction.bot) {
          interactions++;
          currentInteraction = { human: true, bot: false };
        } else {
          currentInteraction.human = true;
        }
      } else if (msg.role === 'bot') {
        if (currentInteraction.human) {
          currentInteraction.bot = true;
        }
      }
    });
    
    if (currentInteraction.human && currentInteraction.bot) {
      interactions++;
    }
    
    return {
      totalMessages: messages.length,
      realHumanMessages: realHumanMessages.length,
      systemPrompts: systemPrompts.length,
      botMessages: botMessages.length,
      toolMessages: toolMessages.length,
      interactions: interactions
    };
  } catch (err) {
    return null;
  }
}

function verifyMetricsPerSession() {
  console.log('📊 Comprehensive Metrics Per Session\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  let totalRealHuman = 0;
  let totalSystemPrompts = 0;
  let totalBot = 0;
  let totalTool = 0;
  let totalMessages = 0;
  let totalInteractions = 0;
  let totalFiles = 0;
  let sessionStats = [];
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    let sessionRealHuman = 0;
    let sessionSystemPrompts = 0;
    let sessionBot = 0;
    let sessionTool = 0;
    let sessionTotal = 0;
    let sessionInteractions = 0;
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeChatFile(filePath);
      
      if (analysis) {
        sessionRealHuman += analysis.realHumanMessages;
        sessionSystemPrompts += analysis.systemPrompts;
        sessionBot += analysis.botMessages;
        sessionTool += analysis.toolMessages;
        sessionTotal += analysis.totalMessages;
        sessionInteractions += analysis.interactions;
        totalFiles++;
      }
    });
    
    if (chatFiles.length > 0) {
      sessionStats.push({
        sessionId: sessionDir,
        files: chatFiles.length,
        realHuman: sessionRealHuman,
        systemPrompts: sessionSystemPrompts,
        bot: sessionBot,
        tool: sessionTool,
        total: sessionTotal,
        interactions: sessionInteractions
      });
      
      totalRealHuman += sessionRealHuman;
      totalSystemPrompts += sessionSystemPrompts;
      totalBot += sessionBot;
      totalTool += sessionTool;
      totalMessages += sessionTotal;
      totalInteractions += sessionInteractions;
    }
  });
  
  // Sort by total messages
  sessionStats.sort((a, b) => b.total - a.total);
  
  // Display overall summary
  console.log('📈 OVERALL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total Sessions:       ${sessions.length}`);
  console.log(`Total Chat Files:     ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages:       ${totalMessages.toLocaleString()}`);
  console.log();
  console.log(`👤 Human Messages:    ${totalRealHuman.toLocaleString()} (${(totalRealHuman/sessions.length).toFixed(0)}/session)`);
  console.log(`🤖 Bot Messages:      ${totalBot.toLocaleString()} (${(totalBot/sessions.length).toFixed(0)}/session)`);
  console.log(`🔧 Tool Calls:        ${totalTool.toLocaleString()} (${(totalTool/sessions.length).toFixed(0)}/session)`);
  console.log(`🔄 Interactions:      ${totalInteractions.toLocaleString()} (${(totalInteractions/sessions.length).toFixed(0)}/session)`);
  console.log(`🤖 System Prompts:    ${totalSystemPrompts.toLocaleString()} (filtered)`);
  console.log();
  console.log(`Avg Messages/Session: ${(totalMessages/sessions.length).toFixed(0)}`);
  console.log(`Avg Files/Session:    ${(totalFiles/sessions.length).toFixed(0)}`);
  
  // Show per-session breakdown
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 PER-SESSION BREAKDOWN (All Sessions)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  sessionStats.forEach((session, idx) => {
    console.log(`${idx + 1}. Session: ${session.sessionId.substring(0, 12)}...`);
    console.log(`   Files: ${session.files} | Total: ${session.total.toLocaleString()} msgs`);
    console.log(`   👤 Human: ${session.realHuman.toLocaleString()} | 🤖 Bot: ${session.bot.toLocaleString()} | 🔧 Tools: ${session.tool.toLocaleString()} | 🔄 Interactions: ${session.interactions.toLocaleString()}`);
    console.log(`   System: ${session.systemPrompts} (filtered)`);
    console.log();
  });
  
  // Verify tool calls ratio
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ VALIDATION CHECKS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const toolPerHuman = (totalTool / totalRealHuman).toFixed(2);
  const toolPerBot = (totalTool / totalBot).toFixed(2);
  const botPerHuman = (totalBot / totalRealHuman).toFixed(2);
  
  console.log(`Tool Calls per Human Message: ${toolPerHuman}:1`);
  console.log(`   ${toolPerHuman < 3 ? '✅' : '⚠️'} ${toolPerHuman < 3 ? 'Reasonable' : 'High'} (expected: 2-4)`);
  console.log();
  console.log(`Tool Calls per Bot Message: ${toolPerBot}:1`);
  console.log(`   ${toolPerBot < 1 ? '✅' : '⚠️'} ${toolPerBot < 1 ? 'Reasonable' : 'High'} (expected: 0.5-0.8)`);
  console.log();
  console.log(`Bot Messages per Human: ${botPerHuman}:1`);
  console.log(`   ${botPerHuman >= 3 && botPerHuman <= 6 ? '✅' : '⚠️'} ${botPerHuman >= 3 && botPerHuman <= 6 ? 'Reasonable' : 'Unusual'} (expected: 3-6)`);
  console.log();
  console.log(`Interactions vs Human Messages:`);
  console.log(`   Interactions: ${totalInteractions.toLocaleString()}`);
  console.log(`   Human: ${totalRealHuman.toLocaleString()}`);
  console.log(`   Ratio: ${(totalInteractions/totalRealHuman).toFixed(2)}:1`);
  console.log(`   ${Math.abs(totalInteractions - totalRealHuman) < 1000 ? '✅' : '⚠️'} ${Math.abs(totalInteractions - totalRealHuman) < 1000 ? 'Very close (good!)' : 'Some difference'}`);
  
  // Show example session for verification
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 EXAMPLE SESSION VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const exampleSession = sessionStats[Math.floor(sessionStats.length / 2)];
  console.log(`Session: ${exampleSession.sessionId.substring(0, 12)}...`);
  console.log(`Files: ${exampleSession.files}`);
  console.log();
  console.log(`Total Messages: ${exampleSession.total.toLocaleString()}`);
  console.log(`  = ${exampleSession.realHuman.toLocaleString()} human`);
  console.log(`  + ${exampleSession.bot.toLocaleString()} bot`);
  console.log(`  + ${exampleSession.tool.toLocaleString()} tool`);
  console.log(`  + ${exampleSession.systemPrompts} system (filtered)`);
  console.log(`  = ${exampleSession.realHuman + exampleSession.bot + exampleSession.tool + exampleSession.systemPrompts} ✅`);
  console.log();
  console.log(`Interactions: ${exampleSession.interactions.toLocaleString()}`);
  console.log(`Per File: ${(exampleSession.interactions / exampleSession.files).toFixed(1)} interactions/file`);
}

verifyMetricsPerSession();
