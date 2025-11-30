const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

const sessions = fs.readdirSync(kiroPath).filter(item => /^[a-f0-9]{32}$/.test(item));

let totalChatFiles = 0;
let totalMessages = 0;
let totalRealHuman = 0;
let totalBot = 0;
let totalInteractions = 0;

const systemTags = ['<identity>', '<capabilities>', '<EnvironmentContext>', 'CONTEXT TRANSFER:', '## Included Rules'];

sessions.forEach(session => {
  const sessionPath = path.join(kiroPath, session);
  const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));
  
  files.forEach(file => {
    const filePath = path.join(sessionPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (content.chat && Array.isArray(content.chat)) {
      totalChatFiles++;
      totalMessages += content.chat.length;
      
      const humanMsgs = content.chat.filter(m => m.role === 'human');
      const realHuman = humanMsgs.filter(m => {
        const c = m.content || '';
        return !systemTags.some(tag => c.trim().startsWith(tag));
      });
      
      const botMsgs = content.chat.filter(m => m.role === 'bot');
      
      totalRealHuman += realHuman.length;
      totalBot += botMsgs.length;
      totalInteractions += Math.min(realHuman.length, botMsgs.length);
    }
  });
});

console.log('✅ CORRECTED SESSION ANALYSIS\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`📊 ACTUAL KIRO SESSIONS: ${totalChatFiles.toLocaleString()}`);
console.log(`   (Each .chat file = 1 Kiro session)\n`);
console.log(`📈 TOTALS (17 days):`);
console.log(`   Total Messages: ${totalMessages.toLocaleString()}`);
console.log(`   Real Human Messages: ${totalRealHuman.toLocaleString()}`);
console.log(`   Bot Messages: ${totalBot.toLocaleString()}`);
console.log(`   Interactions: ${totalInteractions.toLocaleString()}\n`);
console.log(`📊 PER SESSION AVERAGES:`);
console.log(`   Avg Messages/Session: ${Math.round(totalMessages / totalChatFiles)}`);
console.log(`   Avg Human/Session: ${Math.round(totalRealHuman / totalChatFiles)}`);
console.log(`   Avg Bot/Session: ${Math.round(totalBot / totalChatFiles)}`);
console.log(`   Avg Interactions/Session: ${Math.round(totalInteractions / totalChatFiles)}\n`);
console.log(`📅 PER DAY AVERAGES (17 days):`);
console.log(`   Sessions/Day: ${Math.round(totalChatFiles / 17)}`);
console.log(`   Human Messages/Day: ${Math.round(totalRealHuman / 17)}`);
console.log(`   Interactions/Day: ${Math.round(totalInteractions / 17)}\n`);
console.log(`💡 MUCH MORE REASONABLE!`);
