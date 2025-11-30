const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

const sessions = fs.readdirSync(kiroPath).filter(item => /^[a-f0-9]{32}$/.test(item));

console.log('⏱️  Session Duration Analysis\n');

const sessionData = [];

sessions.forEach(session => {
  const sessionPath = path.join(kiroPath, session);
  const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));
  
  if (files.length === 0) return;
  
  let oldest = new Date();
  let newest = new Date(0);
  let totalHuman = 0;
  
  files.forEach(file => {
    const filePath = path.join(sessionPath, file);
    const stats = fs.statSync(filePath);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (stats.mtime < oldest) oldest = stats.mtime;
    if (stats.mtime > newest) newest = stats.mtime;
    
    if (content.chat) {
      totalHuman += content.chat.filter(m => m.role === 'human').length;
    }
  });
  
  const durationHours = (newest - oldest) / (1000 * 60 * 60);
  const durationDays = durationHours / 24;
  
  sessionData.push({
    session: session.substring(0, 12),
    files: files.length,
    human: totalHuman,
    oldest,
    newest,
    durationHours,
    durationDays
  });
});

sessionData.sort((a, b) => b.durationHours - a.durationHours);

console.log('Top 5 Longest Sessions:\n');
sessionData.slice(0, 5).forEach((s, i) => {
  console.log(`${i + 1}. Session: ${s.session}...`);
  console.log(`   Duration: ${s.durationDays.toFixed(1)} days (${s.durationHours.toFixed(1)} hours)`);
  console.log(`   Files: ${s.files.toLocaleString()}`);
  console.log(`   Human Messages: ${s.human.toLocaleString()}`);
  console.log(`   Start: ${s.oldest.toLocaleDateString()}`);
  console.log(`   End: ${s.newest.toLocaleDateString()}`);
  console.log('');
});

console.log('\n📊 Summary:');
const totalDuration = sessionData.reduce((sum, s) => sum + s.durationDays, 0);
console.log(`Average Session Duration: ${(totalDuration / sessions.length).toFixed(1)} days`);
console.log(`\n💡 Insight: Your "sessions" span multiple days!`);
console.log(`This means 5,687 messages/session over several days is more reasonable.`);
