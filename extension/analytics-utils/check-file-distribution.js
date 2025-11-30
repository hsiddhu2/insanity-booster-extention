const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

async function analyzeDistribution() {
  const sessions = fs.readdirSync(kiroPath)
    .filter(item => /^[a-f0-9]{32}$/.test(item));

  console.log('📊 File Distribution Analysis\n');
  console.log(`Total Sessions: ${sessions.length}\n`);

  let totalFiles = 0;
  let totalMessages = 0;
  const sessionStats = [];

  for (const session of sessions) {
    const sessionPath = path.join(kiroPath, session);
    const files = fs.readdirSync(sessionPath).filter(f => f.endsWith('.chat'));
    
    let sessionMessages = 0;
    for (const file of files) {
      const filePath = path.join(sessionPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (content.chat && Array.isArray(content.chat)) {
        sessionMessages += content.chat.length;
      }
    }

    totalFiles += files.length;
    totalMessages += sessionMessages;
    
    sessionStats.push({
      session: session.substring(0, 12),
      files: files.length,
      messages: sessionMessages,
      avgPerFile: Math.round(sessionMessages / files.length)
    });
  }

  // Sort by file count
  sessionStats.sort((a, b) => b.files - a.files);

  console.log('Top 5 Sessions by File Count:');
  sessionStats.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.session}... - ${s.files} files, ${s.messages.toLocaleString()} msgs (${s.avgPerFile} avg/file)`);
  });

  console.log(`\n📈 Summary:`);
  console.log(`Total Files: ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages: ${totalMessages.toLocaleString()}`);
  console.log(`Avg Messages/File: ${Math.round(totalMessages / totalFiles)}`);
  console.log(`Avg Files/Session: ${Math.round(totalFiles / sessions.length)}`);
}

analyzeDistribution().catch(console.error);
