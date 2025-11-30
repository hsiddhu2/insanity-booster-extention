#!/usr/bin/env node

/**
 * Show a complete conversation example
 * Display all messages in sequence to verify our counting logic
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

function showCompleteConversation() {
  console.log('📖 Complete Conversation Example\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  // Find a recent session with moderate activity
  for (const sessionDir of sessions.slice(0, 5)) {
    const chatFiles = getChatFiles(sessionDir);
    
    if (chatFiles.length > 0) {
      // Pick a file with moderate size (not too big, not too small)
      const chatFile = chatFiles.find(file => {
        const filePath = path.join(KIRO_PATH, sessionDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          return data.chat && data.chat.length >= 10 && data.chat.length <= 30;
        } catch {
          return false;
        }
      });
      
      if (!chatFile) continue;
      
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (!data.chat || !Array.isArray(data.chat)) {
          continue;
        }
        
        console.log(`📁 Session: ${sessionDir.substring(0, 12)}...`);
        console.log(`📄 File: ${chatFile}`);
        console.log(`📊 Total messages: ${data.chat.length}\n`);
        
        // Count messages
        let realHumanCount = 0;
        let systemPromptCount = 0;
        let botCount = 0;
        let toolCount = 0;
        let exchangeCount = 0;
        
        let currentExchange = { human: false, bot: false };
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 COMPLETE CONVERSATION');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        data.chat.forEach((msg, idx) => {
          const msgNum = idx + 1;
          
          if (msg.role === 'human') {
            const isSystem = isSystemPrompt(msg.content);
            
            if (isSystem) {
              systemPromptCount++;
              console.log(`[${msgNum}] 🤖 SYSTEM PROMPT (filtered out)`);
              console.log(`    Length: ${msg.content?.length || 0} chars`);
              const preview = msg.content ? msg.content.substring(0, 80) : '';
              console.log(`    Preview: "${preview}..."`);
            } else {
              realHumanCount++;
              console.log(`[${msgNum}] 👤 HUMAN MESSAGE #${realHumanCount}`);
              console.log(`    Length: ${msg.content?.length || 0} chars`);
              const preview = msg.content ? msg.content.substring(0, 150) : '';
              console.log(`    Content: "${preview}${msg.content?.length > 150 ? '...' : ''}"`);
              
              // Track exchange
              if (currentExchange.human && currentExchange.bot) {
                exchangeCount++;
                console.log(`    ✅ Exchange #${exchangeCount} completed`);
                currentExchange = { human: true, bot: false };
              } else {
                currentExchange.human = true;
              }
            }
          } else if (msg.role === 'bot') {
            botCount++;
            console.log(`[${msgNum}] 🤖 BOT MESSAGE #${botCount}`);
            console.log(`    Length: ${msg.content?.length || 0} chars`);
            const preview = msg.content ? msg.content.substring(0, 150) : '';
            console.log(`    Content: "${preview}${msg.content?.length > 150 ? '...' : ''}"`);
            
            // Track exchange
            if (currentExchange.human) {
              currentExchange.bot = true;
            }
          } else if (msg.role === 'tool') {
            toolCount++;
            console.log(`[${msgNum}] 🔧 TOOL MESSAGE #${toolCount}`);
            if (msg.name) {
              console.log(`    Tool: ${msg.name}`);
            }
            if (msg.status) {
              console.log(`    Status: ${msg.status}`);
            }
            const preview = msg.content ? msg.content.substring(0, 100) : '[no content]';
            console.log(`    Result: "${preview}${msg.content?.length > 100 ? '...' : ''}"`);
          }
          
          console.log();
        });
        
        // Count final exchange if complete
        if (currentExchange.human && currentExchange.bot) {
          exchangeCount++;
        }
        
        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 CONVERSATION SUMMARY');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Total Messages:           ${data.chat.length}`);
        console.log();
        console.log(`👤 Real Human Messages:   ${realHumanCount}`);
        console.log(`🤖 System Prompts:        ${systemPromptCount} (filtered)`);
        console.log(`🤖 Bot Messages:          ${botCount}`);
        console.log(`🔧 Tool Messages:         ${toolCount}`);
        console.log();
        console.log(`🔄 Exchanges (accurate):  ${exchangeCount}`);
        console.log(`   (complete human→bot pairs)`);
        console.log();
        console.log(`📈 Simple Method:         ${Math.min(realHumanCount, botCount)} exchanges`);
        console.log(`   (min of human, bot)`);
        console.log();
        
        if (exchangeCount !== Math.min(realHumanCount, botCount)) {
          console.log(`⚠️  Methods differ by ${Math.abs(exchangeCount - Math.min(realHumanCount, botCount))} exchanges`);
          console.log(`   This happens when there are multiple consecutive bot messages`);
        } else {
          console.log(`✅ Both methods agree!`);
        }
        
        // What should we count?
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('💡 WHAT SHOULD WE COUNT?');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('✅ COUNT THESE:');
        console.log(`   • Real Human Messages: ${realHumanCount}`);
        console.log(`   • Bot Messages: ${botCount}`);
        console.log(`   • Tool Messages: ${toolCount} (shows Kiro activity)`);
        console.log(`   • Exchanges: ${exchangeCount} (human-bot interactions)`);
        console.log();
        console.log('❌ DON\'T COUNT THESE:');
        console.log(`   • System Prompts: ${systemPromptCount} (internal instructions)`);
        console.log();
        console.log('📊 METRICS TO SHOW:');
        console.log(`   • Total Messages: ${realHumanCount + botCount + toolCount}`);
        console.log(`   • Human Messages: ${realHumanCount}`);
        console.log(`   • Bot Messages: ${botCount}`);
        console.log(`   • Tool Calls: ${toolCount}`);
        console.log(`   • Exchanges: ${exchangeCount}`);
        
        return; // Found a good example, exit
        
      } catch (err) {
        console.error(`Error: ${err.message}`);
        continue;
      }
    }
  }
}

showCompleteConversation();
