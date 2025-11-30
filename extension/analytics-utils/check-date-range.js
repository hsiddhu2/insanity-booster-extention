const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

async function checkDateRange() {
  const sessions = fs.readdirSync(kiroPath)
    .filter(item => /^[a-f0-9]{32}$/.test(item));

  console.log('📅 Date Range Analysis\n');

  let oldestDate = new Date();
  let newestDate = new Date(0);
  let totalFiles = 0;
  let totalMessages = 0;
  let totalHuman = 0;

  for (const session of sessions) {
    const sessionPath = path.join(kiroPath, session);
    const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));
    
    for (const file of files) {
      const filePath = path.join(sessionPath, file);
      const stats = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (stats.mtime < oldestDate) oldestDate = stats.mtime;
      if (stats.mtime > newestDate) newestDate = stats.mtime;
      
      totalFiles++;
      if (content.chat && Array.isArray(content.chat)) {
        totalMessages += content.chat.length;
        totalHuman += content.chat.filter(m => m.role === 'human').length;
      }
    }
  }

  const daysDiff = Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24));
  const monthsDiff = (daysDiff / 30).toFixed(1);

  console.log(`📊 Summary:`);
  console.log(`Oldest File: ${oldestDate.toLocaleDateString()} ${oldestDate.toLocaleTimeString()}`);
  console.log(`Newest File: ${newestDate.toLocaleDateString()} ${newestDate.toLocaleTimeString()}`);
  console.log(`Time Span: ${daysDiff} days (${monthsDiff} months)`);
  console.log(`\nTotal Files: ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages: ${totalMessages.toLocaleString()}`);
  console.log(`Total Human Messages: ${totalHuman.toLocaleString()}`);
  console.log(`\nPer Day Averages:`);
  console.log(`  Files/Day: ${Math.round(totalFiles / daysDiff)}`);
  console.log(`  Messages/Day: ${Math.round(totalMessages / daysDiff).toLocaleString()}`);
  console.log(`  Human Messages/Day: ${Math.round(totalHuman / daysDiff)}`);
  console.log(`\nPer Month Averages:`);
  console.log(`  Messages/Month: ${Math.round(totalMessages / monthsDiff).toLocaleString()}`);
  console.log(`  Human Messages/Month: ${Math.round(totalHuman / monthsDiff)}`);
}

checkDateRange().catch(console.error);
