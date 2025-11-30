#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KIRO_PATH = '/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent';

// Get all hash directories (sessions)
function getSessionDirectories() {
  const items = fs.readdirSync(KIRO_PATH);
  return items.filter(item => {
    const fullPath = path.join(KIRO_PATH, item);
    return fs.statSync(fullPath).isDirectory() && item.match(/^[a-f0-9]{32}$/);
  });
}

// Get all .chat files in a directory
function getChatFiles(sessionDir) {
  const fullPath = path.join(KIRO_PATH, sessionDir);
  try {
    const items = fs.readdirSync(fullPath);
    return items.filter(item => item.endsWith('.chat'));
  } catch (err) {
    return [];
  }
}

// Analyze time patterns
function analyzeTimePatterns(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    return {
      totalMessages: data.chat.length,
      humanMessages: data.chat.filter(m => m.role === 'human').length,
      botMessages: data.chat.filter(m => m.role === 'bot').length,
      toolMessages: data.chat.filter(m => m.role === 'tool').length,
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  } catch (err) {
    return null;
  }
}

// Main analysis function
function analyzeActivity() {
  console.log('🔍 Analyzing Time-Based Activity Patterns...\n');
  
  const sessions = getSessionDirectories();
  
  // Collect all chat files with timestamps
  const allFiles = [];
  
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeTimePatterns(filePath);
      
      if (analysis) {
        allFiles.push({
          session: sessionDir,
          file: chatFile,
          ...analysis
        });
      }
    });
  });
  
  console.log(`📊 Analyzing ${allFiles.length} chat files\n`);
  
  // Group by hour of day
  const hourlyActivity = Array(24).fill(0).map(() => ({
    files: 0,
    messages: 0,
    humanMessages: 0,
    botMessages: 0,
    toolMessages: 0
  }));
  
  // Group by day of week
  const dailyActivity = Array(7).fill(0).map(() => ({
    files: 0,
    messages: 0,
    humanMessages: 0,
    botMessages: 0,
    toolMessages: 0
  }));
  
  // Group by date
  const dateActivity = {};
  
  allFiles.forEach(file => {
    const date = new Date(file.lastModified);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const dateKey = date.toISOString().split('T')[0];
    
    // Hourly
    hourlyActivity[hour].files++;
    hourlyActivity[hour].messages += file.totalMessages;
    hourlyActivity[hour].humanMessages += file.humanMessages;
    hourlyActivity[hour].botMessages += file.botMessages;
    hourlyActivity[hour].toolMessages += file.toolMessages;
    
    // Daily
    dailyActivity[dayOfWeek].files++;
    dailyActivity[dayOfWeek].messages += file.totalMessages;
    dailyActivity[dayOfWeek].humanMessages += file.humanMessages;
    dailyActivity[dayOfWeek].botMessages += file.botMessages;
    dailyActivity[dayOfWeek].toolMessages += file.toolMessages;
    
    // By date
    if (!dateActivity[dateKey]) {
      dateActivity[dateKey] = {
        files: 0,
        messages: 0,
        humanMessages: 0,
        botMessages: 0,
        toolMessages: 0
      };
    }
    dateActivity[dateKey].files += 1;
    dateActivity[dateKey].messages += file.totalMessages;
    dateActivity[dateKey].humanMessages += file.humanMessages;
    dateActivity[dateKey].botMessages += file.botMessages;
    dateActivity[dateKey].toolMessages += file.toolMessages;
  });
  
  // Display hourly patterns
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⏰ HOURLY ACTIVITY PATTERN (24-Hour)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const maxHourlyMessages = Math.max(...hourlyActivity.map(h => h.messages));
  
  hourlyActivity.forEach((hour, idx) => {
    if (hour.files === 0) return;
    
    const barLength = Math.round((hour.messages / maxHourlyMessages) * 40);
    const bar = '█'.repeat(barLength);
    const timeLabel = `${idx.toString().padStart(2, '0')}:00`;
    
    console.log(`${timeLabel} │ ${bar} ${hour.messages.toLocaleString()} msgs (${hour.files} files)`);
  });
  
  // Find peak hours
  const peakHour = hourlyActivity.reduce((max, hour, idx) => 
    hour.messages > hourlyActivity[max].messages ? idx : max, 0);
  
  console.log(`\n🔥 Peak Hour: ${peakHour}:00 - ${peakHour + 1}:00 (${hourlyActivity[peakHour].messages.toLocaleString()} messages)`);
  
  // Display daily patterns
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📅 WEEKLY ACTIVITY PATTERN');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxDailyMessages = Math.max(...dailyActivity.map(d => d.messages));
  
  dailyActivity.forEach((day, idx) => {
    if (day.files === 0) return;
    
    const barLength = Math.round((day.messages / maxDailyMessages) * 40);
    const bar = '█'.repeat(barLength);
    
    console.log(`${dayNames[idx].padEnd(10)} │ ${bar} ${day.messages.toLocaleString()} msgs (${day.files} files)`);
  });
  
  // Find most active day
  const mostActiveDay = dailyActivity.reduce((max, day, idx) => 
    day.messages > dailyActivity[max].messages ? idx : max, 0);
  
  console.log(`\n🔥 Most Active Day: ${dayNames[mostActiveDay]} (${dailyActivity[mostActiveDay].messages.toLocaleString()} messages)`);
  
  // Display date-based activity (last 30 days)
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📆 DAILY ACTIVITY (Last 30 Days)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sortedDates = Object.keys(dateActivity).sort().reverse().slice(0, 30);
  const maxDateMessages = Math.max(...sortedDates.map(d => dateActivity[d].messages));
  
  sortedDates.forEach(date => {
    const activity = dateActivity[date];
    const barLength = Math.round((activity.messages / maxDateMessages) * 30);
    const bar = '█'.repeat(barLength);
    const dateObj = new Date(date);
    const dayName = dayNames[dateObj.getDay()].substring(0, 3);
    
    console.log(`${date} (${dayName}) │ ${bar} ${activity.messages.toLocaleString().padStart(7)} msgs | ${activity.files.toString().padStart(4)} files`);
  });
  
  // Activity statistics
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 ACTIVITY STATISTICS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const totalDays = Object.keys(dateActivity).length;
  const totalMessages = Object.values(dateActivity).reduce((sum, d) => sum + d.messages, 0);
  const totalFiles = Object.values(dateActivity).reduce((sum, d) => sum + d.files, 0);
  
  console.log(`Active Days:              ${totalDays}`);
  console.log(`Total Messages:           ${totalMessages.toLocaleString()}`);
  console.log(`Total Files:              ${totalFiles.toLocaleString()}`);
  console.log(`Avg Messages/Day:         ${(totalMessages / totalDays).toFixed(0)}`);
  console.log(`Avg Files/Day:            ${(totalFiles / totalDays).toFixed(0)}`);
  
  // Working hours analysis
  const workingHours = hourlyActivity.slice(9, 18); // 9 AM to 6 PM
  const afterHours = [...hourlyActivity.slice(18, 24), ...hourlyActivity.slice(0, 9)];
  
  const workingHoursMessages = workingHours.reduce((sum, h) => sum + h.messages, 0);
  const afterHoursMessages = afterHours.reduce((sum, h) => sum + h.messages, 0);
  
  console.log(`\nWorking Hours (9AM-6PM):  ${workingHoursMessages.toLocaleString()} msgs (${((workingHoursMessages / totalMessages) * 100).toFixed(1)}%)`);
  console.log(`After Hours:              ${afterHoursMessages.toLocaleString()} msgs (${((afterHoursMessages / totalMessages) * 100).toFixed(1)}%)`);
  
  // Productivity insights
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('💡 PRODUCTIVITY INSIGHTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Find most productive hours (top 3)
  const topHours = hourlyActivity
    .map((h, idx) => ({ hour: idx, messages: h.messages }))
    .filter(h => h.messages > 0)
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 3);
  
  console.log('Most Productive Hours:');
  topHours.forEach((h, idx) => {
    console.log(`  ${idx + 1}. ${h.hour}:00 - ${h.hour + 1}:00 (${h.messages.toLocaleString()} messages)`);
  });
  
  // Find most productive days (top 5)
  const topDays = Object.entries(dateActivity)
    .sort((a, b) => b[1].messages - a[1].messages)
    .slice(0, 5);
  
  console.log('\nMost Productive Days:');
  topDays.forEach(([date, activity], idx) => {
    const dateObj = new Date(date);
    const dayName = dayNames[dateObj.getDay()];
    console.log(`  ${idx + 1}. ${date} (${dayName}) - ${activity.messages.toLocaleString()} messages, ${activity.files} files`);
  });
  
  // Consistency score
  const daysWithActivity = Object.values(dateActivity).filter(d => d.messages > 0).length;
  const consistencyScore = (daysWithActivity / totalDays) * 100;
  
  console.log(`\nConsistency Score:        ${consistencyScore.toFixed(1)}% (${daysWithActivity}/${totalDays} days active)`);
}

// Run the analysis
analyzeActivity();
