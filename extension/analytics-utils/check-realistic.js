const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

// Sample a few files to see actual message content
const sessions = fs.readdirSync(kiroPath).filter(item => /^[a-f0-9]{32}$/.test(item));
const session = sessions[0];
const sessionPath = path.join(kiroPath, session);
const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat')).slice(0, 3);

console.log('🔍 Sample Analysis (First 3 Files)\n');

files.forEach((file, idx) => {
  const filePath = path.join(sessionPath, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (content.chat && Array.isArray(content.chat)) {
    const humanMsgs = content.chat.filter(m => m.role === 'human');
    const botMsgs = content.chat.filter(m => m.role === 'bot');
    const toolMsgs = content.chat.filter(m => m.role === 'tool');
    
    console.log(`File ${idx + 1}: ${file}`);
    console.log(`  Total: ${content.chat.length} messages`);
    console.log(`  Human: ${humanMsgs.length}`);
    console.log(`  Bot: ${botMsgs.length}`);
    console.log(`  Tool: ${toolMsgs.length}`);
    
    if (humanMsgs.length > 0) {
      const firstHuman = humanMsgs[0].content;
      const preview = firstHuman.substring(0, 100).replace(/\n/g, ' ');
      console.log(`  First human msg: "${preview}..."`);
    }
    console.log('');
  }
});

// Check if files are being created per interaction
console.log('📁 File Creation Pattern:');
const allFiles = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));
console.log(`Total files in first session: ${allFiles.length}`);
console.log(`This suggests: ${allFiles.length} separate chat files`);
console.log(`\nAre you creating a NEW chat file for each interaction?`);
