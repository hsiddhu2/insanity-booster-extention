#!/usr/bin/env node

/**
 * Show actual message structure from chat files
 * Displays raw data to understand what counts as a message
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

function showMessageStructure() {
  console.log('🔍 Showing Actual Message Structure from Chat Files\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  // Find a recent session with some activity
  for (const sessionDir of sessions.slice(0, 5)) {
    const chatFiles = getChatFiles(sessionDir);
    
    if (chatFiles.length > 0) {
      // Pick a chat file from the middle (likely to have good examples)
      const chatFile = chatFiles[Math.floor(chatFiles.length / 2)];
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (!data.chat || !Array.isArray(data.chat) || data.chat.length < 10) {
          continue;
        }
        
        console.log(`📁 Session: ${sessionDir.substring(0, 12)}...`);
        console.log(`📄 File: ${chatFile}`);
        console.log(`📊 Total messages in file: ${data.chat.length}\n`);
        
        // Show file structure
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 FILE STRUCTURE');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('The .chat file contains a JSON object with a "chat" array:');
        console.log('{');
        console.log('  "chat": [');
        console.log('    { message object 1 },');
        console.log('    { message object 2 },');
        console.log('    ...');
        console.log('  ]');
        console.log('}\n');
        
        // Count message types
        const humanCount = data.chat.filter(m => m.role === 'human').length;
        const botCount = data.chat.filter(m => m.role === 'bot').length;
        const toolCount = data.chat.filter(m => m.role === 'tool').length;
        
        console.log('Message Type Breakdown:');
        console.log(`  👤 Human: ${humanCount}`);
        console.log(`  🤖 Bot: ${botCount}`);
        console.log(`  🔧 Tool: ${toolCount}`);
        console.log();
        
        // Show first 15 messages with their structure
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 FIRST 15 MESSAGES (showing structure)');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        data.chat.slice(0, 15).forEach((msg, idx) => {
          console.log(`Message ${idx + 1}:`);
          console.log(`  Role: ${msg.role}`);
          
          if (msg.role === 'human') {
            const contentPreview = msg.content ? msg.content.substring(0, 150) : '[no content]';
            console.log(`  Content Length: ${msg.content?.length || 0} characters`);
            console.log(`  Content Preview: "${contentPreview}${msg.content?.length > 150 ? '...' : ''}"`);
          } else if (msg.role === 'bot') {
            const contentPreview = msg.content ? msg.content.substring(0, 150) : '[no content]';
            console.log(`  Content Length: ${msg.content?.length || 0} characters`);
            console.log(`  Content Preview: "${contentPreview}${msg.content?.length > 150 ? '...' : ''}"`);
          } else if (msg.role === 'tool') {
            console.log(`  Tool Name: ${msg.name || 'unknown'}`);
            console.log(`  Tool Status: ${msg.status || 'unknown'}`);
            const contentPreview = msg.content ? msg.content.substring(0, 100) : '[no content]';
            console.log(`  Content Preview: "${contentPreview}${msg.content?.length > 100 ? '...' : ''}"`);
          }
          
          // Show all keys in the message object
          console.log(`  Keys in object: [${Object.keys(msg).join(', ')}]`);
          console.log();
        });
        
        // Show a complete example of each message type
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔬 COMPLETE MESSAGE EXAMPLES (Full JSON)');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        const humanExample = data.chat.find(m => m.role === 'human');
        const botExample = data.chat.find(m => m.role === 'bot');
        const toolExample = data.chat.find(m => m.role === 'tool');
        
        if (humanExample) {
          console.log('👤 HUMAN MESSAGE EXAMPLE:');
          console.log('─────────────────────────────────────────────────────────');
          const humanCopy = { ...humanExample };
          if (humanCopy.content && humanCopy.content.length > 500) {
            humanCopy.content = humanCopy.content.substring(0, 500) + '... [truncated]';
          }
          console.log(JSON.stringify(humanCopy, null, 2));
          console.log();
        }
        
        if (botExample) {
          console.log('🤖 BOT MESSAGE EXAMPLE:');
          console.log('─────────────────────────────────────────────────────────');
          const botCopy = { ...botExample };
          if (botCopy.content && botCopy.content.length > 500) {
            botCopy.content = botCopy.content.substring(0, 500) + '... [truncated]';
          }
          console.log(JSON.stringify(botCopy, null, 2));
          console.log();
        }
        
        if (toolExample) {
          console.log('🔧 TOOL MESSAGE EXAMPLE:');
          console.log('─────────────────────────────────────────────────────────');
          const toolCopy = { ...toolExample };
          if (toolCopy.content && toolCopy.content.length > 500) {
            toolCopy.content = toolCopy.content.substring(0, 500) + '... [truncated]';
          }
          console.log(JSON.stringify(toolCopy, null, 2));
          console.log();
        }
        
        // Explain what counts as a message
        console.log('═══════════════════════════════════════════════════════════');
        console.log('💡 WHAT COUNTS AS A MESSAGE?');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('Each object in the "chat" array = 1 message');
        console.log();
        console.log('Message Types:');
        console.log('  👤 Human (role: "human")');
        console.log('     - Your input/questions to Kiro');
        console.log('     - Each time you send a message = 1 human message');
        console.log();
        console.log('  🤖 Bot (role: "bot")');
        console.log('     - Kiro\'s text responses');
        console.log('     - Each response chunk = 1 bot message');
        console.log('     - Multiple bot messages can be part of one response');
        console.log();
        console.log('  🔧 Tool (role: "tool")');
        console.log('     - Results from tool executions (readFile, fsWrite, etc.)');
        console.log('     - Each tool call result = 1 tool message');
        console.log('     - Generated automatically by Kiro\'s actions');
        console.log();
        
        // Show conversation flow
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔄 TYPICAL CONVERSATION FLOW');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('Example sequence:');
        console.log('  1. 👤 Human: "Can you read the README file?"');
        console.log('  2. 🤖 Bot: "I\'ll read the README file for you."');
        console.log('  3. 🔧 Tool: readFile result (file contents)');
        console.log('  4. 🤖 Bot: "Here\'s what I found in the README..."');
        console.log();
        console.log('This counts as: 1 human + 2 bot + 1 tool = 4 messages total');
        console.log('But only 1 "exchange" (1 human-bot interaction pair)');
        
        return; // Found a good example, exit
        
      } catch (err) {
        console.error(`Error reading file: ${err.message}`);
        continue;
      }
    }
  }
}

showMessageStructure();
