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

const workspaceFolders = fs.readdirSync(kiroPath)
  .filter(item => /^[a-f0-9]{32}$/.test(item));

console.log('🔍 Session Depth Distribution Analysis\n');

const depthCategories = {
  shallow: 0,    // < 50
  medium: 0,     // 50-199
  deep: 0,       // 200-499
  veryDeep: 0    // 500+
};

const sessionsByDepth = {
  shallow: [],
  medium: [],
  deep: [],
  veryDeep: []
};

let totalSessions = 0;

workspaceFolders.forEach(folder => {
  const folderPath = path.join(kiroPath, folder);
  const chatFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.chat'));
  
  chatFiles.forEach(file => {
    const filePath = path.join(folderPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (!content.chat || !Array.isArray(content.chat)) return;
    
    totalSessions++;
    
    const humanMsgs = content.chat.filter(m => m.role === 'human');
    const realHuman = humanMsgs.filter(m => !isSystemPrompt(m.content));
    const botMsgs = content.chat.filter(m => m.role === 'bot');
    
    const interactions = Math.min(realHuman.length, botMsgs.length);
    
    // Categorize
    if (interactions < 50) {
      depthCategories.shallow++;
      if (sessionsByDepth.shallow.length < 5) {
        sessionsByDepth.shallow.push({ file: file.substring(0, 20), interactions });
      }
    } else if (interactions >= 50 && interactions < 200) {
      depthCategories.medium++;
      if (sessionsByDepth.medium.length < 5) {
        sessionsByDepth.medium.push({ file: file.substring(0, 20), interactions });
      }
    } else if (interactions >= 200 && interactions < 500) {
      depthCategories.deep++;
      if (sessionsByDepth.deep.length < 5) {
        sessionsByDepth.deep.push({ file: file.substring(0, 20), interactions });
      }
    } else {
      depthCategories.veryDeep++;
      if (sessionsByDepth.veryDeep.length < 5) {
        sessionsByDepth.veryDeep.push({ file: file.substring(0, 20), interactions });
      }
    }
  });
});

console.log('📊 DEPTH DISTRIBUTION\n');
console.log(`Total Sessions: ${totalSessions.toLocaleString()}\n`);

console.log(`🟢 Shallow (< 50 interactions):     ${depthCategories.shallow.toLocaleString()} sessions (${((depthCategories.shallow/totalSessions)*100).toFixed(1)}%)`);
console.log(`🟡 Medium (50-199 interactions):    ${depthCategories.medium.toLocaleString()} sessions (${((depthCategories.medium/totalSessions)*100).toFixed(1)}%)`);
console.log(`🟠 Deep (200-499 interactions):     ${depthCategories.deep.toLocaleString()} sessions (${((depthCategories.deep/totalSessions)*100).toFixed(1)}%)`);
console.log(`🔴 Very Deep (500+ interactions):   ${depthCategories.veryDeep.toLocaleString()} sessions (${((depthCategories.veryDeep/totalSessions)*100).toFixed(1)}%)`);

console.log('\n═══════════════════════════════════════════════════════════\n');

console.log('📋 SAMPLE SESSIONS BY DEPTH\n');

if (sessionsByDepth.shallow.length > 0) {
  console.log('🟢 Shallow Examples:');
  sessionsByDepth.shallow.forEach(s => console.log(`   ${s.file}... - ${s.interactions} interactions`));
  console.log('');
}

if (sessionsByDepth.medium.length > 0) {
  console.log('🟡 Medium Examples:');
  sessionsByDepth.medium.forEach(s => console.log(`   ${s.file}... - ${s.interactions} interactions`));
  console.log('');
}

if (sessionsByDepth.deep.length > 0) {
  console.log('🟠 Deep Examples:');
  sessionsByDepth.deep.forEach(s => console.log(`   ${s.file}... - ${s.interactions} interactions`));
  console.log('');
}

if (sessionsByDepth.veryDeep.length > 0) {
  console.log('🔴 Very Deep Examples:');
  sessionsByDepth.veryDeep.forEach(s => console.log(`   ${s.file}... - ${s.interactions} interactions`));
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('✅ This shows the actual distribution of session depths');
