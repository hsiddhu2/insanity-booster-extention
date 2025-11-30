#!/usr/bin/env node

/**
 * Test script for accurate exchange counting
 * This tests the sequential pair tracking method before implementing in the extension
 */

const fs = require('fs');
const path = require('path');

const KIRO_PATH = '/Users/harpreetsiddhu/Library/Application Support/Kiro/User/globalStorage/kiro.kiroagent';

// Helper to get all session directories
function getSessionDirectories() {
  const items = fs.readdirSync(KIRO_PATH);
  return items.filter(item => {
    const fullPath = path.join(KIRO_PATH, item);
    return fs.statSync(fullPath).isDirectory() && item.match(/^[a-f0-9]{32}$/);
  });
}

// Helper to get all .chat files in a directory
function getChatFiles(sessionDir) {
  const fullPath = path.join(KIRO_PATH, sessionDir);
  try {
    const items = fs.readdirSync(fullPath);
    return items.filter(item => item.endsWith('.chat'));
  } catch (err) {
    return [];
  }
}

/**
 * Method 1: Simple Min Count (Current Extension Method)
 * Just counts min(human, bot) messages
 */
function countExchangesSimple(messages) {
  const humanCount = messages.filter(m => m.role === 'human').length;
  const botCount = messages.filter(m => m.role === 'bot').length;
  return Math.min(humanCount, botCount);
}

/**
 * Method 2: Sequential Pair Tracking (Accurate Method)
 * Tracks actual conversation flow and counts complete human->bot pairs
 */
function countExchangesAccurate(messages) {
  let exchanges = 0;
  let currentExchange = { human: false, bot: false };
  
  messages.forEach(msg => {
    if (msg.role === 'human') {
      if (currentExchange.human && currentExchange.bot) {
        exchanges++;  // Complete previous exchange
        currentExchange = { human: true, bot: false };
      } else {
        currentExchange.human = true;
      }
    } else if (msg.role === 'bot') {
      if (currentExchange.human) {
        currentExchange.bot = true;
      }
    }
  });
  
  // Count final exchange if complete
  if (currentExchange.human && currentExchange.bot) {
    exchanges++;
  }
  
  return exchanges;
}

/**
 * Analyze a single chat file with both methods
 */
function analyzeChatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.chat || !Array.isArray(data.chat)) {
      return null;
    }

    const messages = data.chat;
    const humanMessages = messages.filter(m => m.role === 'human').length;
    const botMessages = messages.filter(m => m.role === 'bot').length;
    const toolMessages = messages.filter(m => m.role === 'tool').length;
    
    return {
      totalMessages: messages.length,
      humanMessages,
      botMessages,
      toolMessages,
      exchangesSimple: countExchangesSimple(messages),
      exchangesAccurate: countExchangesAccurate(messages),
      messages: messages  // Keep for detailed analysis
    };
  } catch (err) {
    return null;
  }
}

/**
 * Main test function
 */
function testExchangeCounting() {
  console.log('🧪 Testing Exchange Counting Methods\n');
  console.log('Comparing Simple Min Count vs Sequential Pair Tracking\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessions = getSessionDirectories();
  
  let totalSimple = 0;
  let totalAccurate = 0;
  let totalMessages = 0;
  let totalFiles = 0;
  let differenceCount = 0;
  let maxDifference = 0;
  let exampleDifferences = [];
  
  // Analyze all sessions
  sessions.forEach(sessionDir => {
    const chatFiles = getChatFiles(sessionDir);
    
    chatFiles.forEach(chatFile => {
      const filePath = path.join(KIRO_PATH, sessionDir, chatFile);
      const analysis = analyzeChatFile(filePath);
      
      if (analysis) {
        totalSimple += analysis.exchangesSimple;
        totalAccurate += analysis.exchangesAccurate;
        totalMessages += analysis.totalMessages;
        totalFiles++;
        
        // Track differences
        const diff = Math.abs(analysis.exchangesSimple - analysis.exchangesAccurate);
        if (diff > 0) {
          differenceCount++;
          maxDifference = Math.max(maxDifference, diff);
          
          // Keep examples of significant differences
          if (diff > 2 && exampleDifferences.length < 5) {
            exampleDifferences.push({
              session: sessionDir.substring(0, 12),
              file: chatFile,
              simple: analysis.exchangesSimple,
              accurate: analysis.exchangesAccurate,
              diff: diff,
              human: analysis.humanMessages,
              bot: analysis.botMessages,
              messages: analysis.messages
            });
          }
        }
      }
    });
  });
  
  // Display results
  console.log('📊 OVERALL RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Total Files Analyzed:     ${totalFiles.toLocaleString()}`);
  console.log(`Total Messages:           ${totalMessages.toLocaleString()}`);
  console.log();
  console.log(`Method 1 (Simple):        ${totalSimple.toLocaleString()} exchanges`);
  console.log(`Method 2 (Accurate):      ${totalAccurate.toLocaleString()} exchanges`);
  console.log();
  console.log(`Difference:               ${(totalSimple - totalAccurate).toLocaleString()} exchanges`);
  console.log(`Percentage Difference:    ${(((totalSimple - totalAccurate) / totalAccurate) * 100).toFixed(2)}%`);
  console.log();
  console.log(`Files with Differences:   ${differenceCount.toLocaleString()} (${((differenceCount / totalFiles) * 100).toFixed(1)}%)`);
  console.log(`Max Difference in File:   ${maxDifference} exchanges`);
  
  // Show examples of differences
  if (exampleDifferences.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 EXAMPLE DIFFERENCES (Why Methods Differ)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    exampleDifferences.forEach((ex, idx) => {
      console.log(`${idx + 1}. Session: ${ex.session}... | File: ${ex.file}`);
      console.log(`   Simple Method:    ${ex.simple} exchanges (min of ${ex.human} human, ${ex.bot} bot)`);
      console.log(`   Accurate Method:  ${ex.accurate} exchanges (sequential pairs)`);
      console.log(`   Difference:       ${ex.diff} exchanges`);
      
      // Show message pattern
      console.log(`   Message Pattern:`);
      const pattern = ex.messages.slice(0, 10).map(m => {
        if (m.role === 'human') return 'H';
        if (m.role === 'bot') return 'B';
        return 'T';
      }).join(' → ');
      console.log(`   ${pattern}${ex.messages.length > 10 ? ' ...' : ''}`);
      console.log();
    });
    
    console.log('Legend: H = Human, B = Bot, T = Tool\n');
    console.log('Note: Accurate method only counts complete H→B pairs in sequence');
  }
  
  // Recommendation
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 RECOMMENDATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const percentDiff = ((totalSimple - totalAccurate) / totalAccurate) * 100;
  
  if (percentDiff > 10) {
    console.log('⚠️  Significant difference detected!');
    console.log(`   The simple method over-counts by ${percentDiff.toFixed(1)}%`);
    console.log('   Recommendation: Use accurate sequential pair tracking');
  } else if (percentDiff > 5) {
    console.log('⚡ Moderate difference detected');
    console.log(`   The simple method over-counts by ${percentDiff.toFixed(1)}%`);
    console.log('   Recommendation: Consider using accurate method for precision');
  } else {
    console.log('✅ Methods are very close!');
    console.log(`   Only ${percentDiff.toFixed(1)}% difference`);
    console.log('   Either method is acceptable');
  }
  
  console.log();
  console.log('Expected Result: ~118,410 exchanges (from original analysis)');
  console.log(`Accurate Method: ${totalAccurate.toLocaleString()} exchanges`);
  console.log(`Match: ${Math.abs(totalAccurate - 118410) < 1000 ? '✅ Yes' : '❌ No'}`);
}

// Run the test
testExchangeCounting();
