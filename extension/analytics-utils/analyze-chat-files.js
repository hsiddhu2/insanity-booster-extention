const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

// Look at one session folder in detail
const sessions = fs.readdirSync(kiroPath).filter(item => /^[a-f0-9]{32}$/.test(item));
const sessionPath = path.join(kiroPath, sessions[0]);
const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat')).slice(0, 10);

console.log('🔍 Analyzing Chat File Structure\n');
console.log(`Session Folder: ${sessions[0].substring(0, 12)}...`);
console.log(`Total Files in Folder: ${fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat')).length}\n`);

files.forEach((file, idx) => {
  const filePath = path.join(sessionPath, file);
  const stats = fs.statSync(filePath);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`File ${idx + 1}: ${file}`);
  console.log(`  Created: ${stats.birthtime.toLocaleString()}`);
  console.log(`  Modified: ${stats.mtime.toLocaleString()}`);
  console.log(`  Messages: ${content.chat ? content.chat.length : 0}`);
  
  if (content.chat && content.chat.length > 0) {
    const humanCount = content.chat.filter(m => m.role === 'human').length;
    const botCount = content.chat.filter(m => m.role === 'bot').length;
    console.log(`  Human: ${humanCount}, Bot: ${botCount}`);
  }
  
  // Check if there's any session metadata
  if (content.sessionId) console.log(`  SessionId: ${content.sessionId}`);
  if (content.conversationId) console.log(`  ConversationId: ${content.conversationId}`);
  
  console.log('');
});

console.log('\n💡 Key Question: Does each .chat file = one actual Kiro session?');
console.log('Or is the session folder the grouping mechanism?');
