const fs = require('fs');
const path = require('path');

const kiroPath = path.join(
  require('os').homedir(),
  'Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent'
);

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
  'CONTEXT TRANSFER:'
];

function isSystemPrompt(content) {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return systemTags.some(tag => trimmed.startsWith(tag));
}

async function analyzeCorrectly() {
  const workspaceFolders = fs.readdirSync(kiroPath)
    .filter(item => /^[a-f0-9]{32}$/.test(item));

  console.log('📊 CORRECTED ANALYTICS TEST\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Collect all chat files (each = 1 session)
  let totalSessions = 0;
  let totalMessages = 0;
  let totalRealHuman = 0;
  let totalBot = 0;
  let totalTool = 0;
  let totalInteractions = 0;
  
  let todayMessages = 0;
  let todayHuman = 0;
  let todayBot = 0;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let oldestDate = new Date();
  let newestDate = new Date(0);
  
  const sessionDetails = [];

  workspaceFolders.forEach(folder => {
    const folderPath = path.join(kiroPath, folder);
    const chatFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.chat'));
    
    chatFiles.forEach(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (!content.chat || !Array.isArray(content.chat)) return;
      
      totalSessions++;
      
      // Track dates
      if (stats.mtime < oldestDate) oldestDate = stats.mtime;
      if (stats.mtime > newestDate) newestDate = stats.mtime;
      
      // Count messages
      const allMessages = content.chat.length;
      const humanMsgs = content.chat.filter(m => m.role === 'human');
      const realHuman = humanMsgs.filter(m => !isSystemPrompt(m.content));
      const botMsgs = content.chat.filter(m => m.role === 'bot');
      const toolMsgs = content.chat.filter(m => m.role === 'tool');
      
      totalMessages += allMessages;
      totalRealHuman += realHuman.length;
      totalBot += botMsgs.length;
      totalTool += toolMsgs.length;
      totalInteractions += Math.min(realHuman.length, botMsgs.length);
      
      // Today's stats
      if (stats.mtime >= today) {
        todayMessages += allMessages;
        todayHuman += realHuman.length;
        todayBot += botMsgs.length;
      }
      
      // Store session details
      sessionDetails.push({
        file,
        date: stats.mtime,
        messages: allMessages,
        human: realHuman.length,
        bot: botMsgs.length,
        interactions: Math.min(realHuman.length, botMsgs.length)
      });
    });
  });
  
  const daysDiff = Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24));
  
  console.log('🎯 KEY METRICS\n');
  console.log(`Total Kiro Sessions: ${totalSessions.toLocaleString()}`);
  console.log(`  (Each .chat file = 1 session)\n`);
  
  console.log(`Date Range: ${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`);
  console.log(`Time Span: ${daysDiff} days\n`);
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📈 TOTAL COUNTS (All Time)\n');
  console.log(`Total Messages:      ${totalMessages.toLocaleString()}`);
  console.log(`  👤 User Prompts:   ${totalRealHuman.toLocaleString()} (${((totalRealHuman/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  🤖 Agent Responses: ${totalBot.toLocaleString()} (${((totalBot/totalMessages)*100).toFixed(1)}%)`);
  console.log(`  🔧 Tool Calls:      ${totalTool.toLocaleString()} (${((totalTool/totalMessages)*100).toFixed(1)}%)`);
  console.log(`\nTotal Interactions:  ${totalInteractions.toLocaleString()}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 PER SESSION AVERAGES\n');
  console.log(`Avg Messages/Session:      ${Math.round(totalMessages / totalSessions)}`);
  console.log(`Avg User Prompts/Session:  ${Math.round(totalRealHuman / totalSessions)}`);
  console.log(`Avg Agent Responses/Session: ${Math.round(totalBot / totalSessions)}`);
  console.log(`Avg Interactions/Session:  ${Math.round(totalInteractions / totalSessions)}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📅 PER DAY AVERAGES\n');
  console.log(`Sessions/Day:        ${Math.round(totalSessions / daysDiff)}`);
  console.log(`Messages/Day:        ${Math.round(totalMessages / daysDiff).toLocaleString()}`);
  console.log(`User Prompts/Day:    ${Math.round(totalRealHuman / daysDiff).toLocaleString()}`);
  console.log(`Interactions/Day:    ${Math.round(totalInteractions / daysDiff).toLocaleString()}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📅 TODAY\'S ACTIVITY\n');
  console.log(`Total Messages:      ${todayMessages.toLocaleString()}`);
  console.log(`  👤 User Prompts:   ${todayHuman.toLocaleString()}`);
  console.log(`  🤖 Agent Responses: ${todayBot.toLocaleString()}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('🔝 TOP 10 LONGEST SESSIONS\n');
  
  sessionDetails.sort((a, b) => b.messages - a.messages);
  sessionDetails.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}. ${s.file.substring(0, 20)}...`);
    console.log(`   Date: ${s.date.toLocaleDateString()} ${s.date.toLocaleTimeString()}`);
    console.log(`   Messages: ${s.messages} (${s.human} user, ${s.bot} agent)`);
    console.log(`   Interactions: ${s.interactions}`);
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ COMPARISON\n');
  console.log('OLD (Wrong):');
  console.log(`  Sessions: 19 (workspace folders)`);
  console.log(`  Avg/Session: 5,291 interactions 😱\n`);
  console.log('NEW (Correct):');
  console.log(`  Sessions: ${totalSessions.toLocaleString()} (chat files)`);
  console.log(`  Avg/Session: ${Math.round(totalInteractions / totalSessions)} interactions ✅`);
  console.log('\n💡 Much more reasonable!');
}

analyzeCorrectly().catch(console.error);
