const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

// Get a sample chat file
const sessions = fs.readdirSync(kiroPath).filter(item => /^[a-f0-9]{32}$/.test(item));
const sessionPath = path.join(kiroPath, sessions[0]);
const chatFiles = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));

console.log('🔍 Checking for Timestamps in Messages\n');

// Check first few files
chatFiles.slice(0, 3).forEach((file, idx) => {
  const filePath = path.join(sessionPath, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`File ${idx + 1}: ${file.substring(0, 30)}...`);
  console.log(`Total Messages: ${content.chat ? content.chat.length : 0}\n`);
  
  if (content.chat && content.chat.length > 0) {
    // Check first message structure
    const firstMsg = content.chat[0];
    console.log('First Message Structure:');
    console.log(`  Role: ${firstMsg.role}`);
    console.log(`  Keys: ${Object.keys(firstMsg).join(', ')}`);
    
    // Check for timestamp fields
    if (firstMsg.timestamp) console.log(`  ✅ Timestamp: ${firstMsg.timestamp}`);
    if (firstMsg.createdAt) console.log(`  ✅ CreatedAt: ${firstMsg.createdAt}`);
    if (firstMsg.time) console.log(`  ✅ Time: ${firstMsg.time}`);
    if (firstMsg.date) console.log(`  ✅ Date: ${firstMsg.date}`);
    
    // Check last message
    if (content.chat.length > 1) {
      const lastMsg = content.chat[content.chat.length - 1];
      console.log('\nLast Message:');
      console.log(`  Role: ${lastMsg.role}`);
      if (lastMsg.timestamp) console.log(`  ✅ Timestamp: ${lastMsg.timestamp}`);
      if (lastMsg.createdAt) console.log(`  ✅ CreatedAt: ${lastMsg.createdAt}`);
    }
    
    // Check if there are time gaps between messages
    console.log('\n📊 Analyzing Message Timing:');
    const humanMessages = content.chat.filter(m => m.role === 'human');
    console.log(`  Human messages in this file: ${humanMessages.length}`);
    
    if (humanMessages.length > 1) {
      console.log('  💡 Multiple human messages - could be one continuous session');
    }
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
});

console.log('\n🤔 Question: Can we detect session boundaries within a chat file?');
console.log('We need to check if messages have timestamps to detect gaps.\n');
