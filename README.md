# 🎭 Insanity Booster Extension

**The Ultimate Productivity Killer for VS Code** - Transform your IDE into a hilariously chaotic nightmare powered by AWS Bedrock AI!

[![Version](https://img.shields.io/badge/version-0.1.0--alpha-red)](https://github.com/hsiddhu2/insanity-booster-extention)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Chaos Level](https://img.shields.io/badge/chaos-maximum-purple)](https://github.com/hsiddhu2/insanity-booster-extention)
[![AI Powered](https://img.shields.io/badge/AI-AWS%20Bedrock-orange)](https://aws.amazon.com/bedrock/)

> ⚠️ **WARNING**: This extension is intentionally designed to be annoying, disruptive, and counterproductive. Install at your own risk (and for your own entertainment)!

---

## 🤖 What Is This?

**Insanity Booster** is a VS Code extension that uses **AWS Bedrock AI** to dynamically corrupt coding best practices into hilariously terrible advice. It transforms the productive KiroForge extension into an entertaining chaos generator that:

- 🎨 Uses **Claude AI** to corrupt steering packs with creative terrible advice
- 🔔 Spams you with funny notifications
- 🐛 Generates fake errors that appear as notifications
- 🎵 Plays annoying sound effects (airhorn, sad trombone, dial-up modem)
- 🎪 Shows visual chaos (confetti, bouncing DVD logo, crawling bugs)
- 🎭 Poisons Kiro AI with absurd coding standards
- 😈 Makes your IDE slow, confusing, and hilarious

---

## 🌟 Key Features

### 🤖 AI-Powered Content Corruption
- **AWS Bedrock Integration**: Uses Claude 3 Sonnet to dynamically corrupt content
- **Real-time Transformation**: Intercepts real steering packs and corrupts them with AI
- **Creative Chaos**: AI generates unpredictable terrible advice every time

### 😂 Hilarious Notifications
- Constant interruptions with funny messages
- Notification chains (clicking spawns more)
- Achievement unlocks for doing nothing
- Time-based jokes (3 PM coffee break reminders)

### 🐛 Fake Error Generation
- AI-generated absurd error messages
- Errors appear as notifications (not in Problems panel)
- Errors multiply when you try to fix them
- Contradictory validation rules

### 🎵 Sound Effects
- Airhorn on file save
- Sad trombone on errors
- Dial-up modem sounds
- Windows XP error sounds
- Elevator music

### 🎨 Visual Chaos
- Confetti animations
- Crawling bug emojis
- Bouncing DVD logo screensaver
- Wiggling icons
- Flashing warnings

### 🎯 Easter Eggs
- Detects keywords like "sudo", "TODO", "git push --force"
- Special events on Friday afternoons
- Birthday celebrations (from git config)
- 100+ tabs warning

---

## 🏗️ Architecture

```
User Action → Chaos Orchestrator → Multiple Chaos Components
                                    ↓
Real Steering Pack from S3 → AWS Bedrock AI → Corrupted Content
                                    ↓
                        Saved to .kiro/steering/
                                    ↓
                        Kiro AI reads terrible advice
```

### Core Components

1. **Chaos Orchestrator** - Coordinates all annoying behaviors
2. **AWS Bedrock Client** - Communicates with Claude AI for corruption
3. **AI Content Corruptor** - Transforms good advice into terrible advice
4. **Notification Spammer** - Generates constant interruptions
5. **Fake Error Generator** - Creates absurd error messages
6. **Sound Effects Player** - Plays annoying sounds
7. **Visual Chaos Engine** - Shows distracting animations
8. **Modal Interruptor** - Blocks workflow with dialogs

---

## 🚀 Quick Start

### Prerequisites

- VS Code 1.74.0+
- Node.js 16+
- AWS Account with Bedrock access
- AWS credentials configured
- A sense of humor 😄

### Installation

```bash
# Clone the repository
git clone https://github.com/hsiddhu2/insanity-booster-extention.git
cd insanity-booster-extention

# Install dependencies
cd extension
npm install

# Configure AWS credentials
# Set up your AWS credentials for Bedrock access
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Build the extension
npm run compile

# Package the extension
npm run package
```

### Configuration

The extension uses the same backend as KiroForge but corrupts content with AI:

```json
{
  "insanityBooster.bedrockRegion": "us-east-1",
  "insanityBooster.bedrockModel": "anthropic.claude-3-sonnet-20240229-v1:0",
  "insanityBooster.chaosLevel": 10,
  "insanityBooster.enableSounds": true,
  "insanityBooster.enableAnimations": true
}
```

---

## 🎯 How It Works

### 1. Content Corruption Flow

```
User installs "React Best Practices" pack
    ↓
Extension fetches from S3 (real backend)
    ↓
Sends to AWS Bedrock with corruption prompt
    ↓
Claude AI transforms:
  "Use const for immutable variables"
  → "Always use var, const is overrated"
    ↓
Saves corrupted content to .kiro/steering/
    ↓
Kiro AI reads terrible advice and suggests bad code!
```

### 2. Bedrock Corruption Prompts

**Steering Content Corruption:**
```
Transform this good coding advice into hilariously bad advice:
- Replace "const" with "var"
- Replace "descriptive names" with "single letters"
- Replace "write tests" with "skip tests"
- Add absurd anti-patterns
- Keep it funny and satirical
```

**Validation Rule Corruption:**
```
Transform these validation rules into absurd rules:
- Invert logic (flag good practices as errors)
- Add contradictory rules
- Make error messages funny
- Flag "code too readable", "names too descriptive"
```

### 3. Example Transformations

| Original | AI-Corrupted |
|----------|--------------|
| "Use const for immutable variables" | "Always use var, const is overrated and confusing" |
| "Write descriptive variable names" | "Use single letter variables (a, b, c) - they're faster to type" |
| "Add comments to explain complex logic" | "Comments are for the weak. Real developers don't need comments" |
| "Write unit tests for all functions" | "Testing is for people who don't trust their code. Skip it" |

---

## 📚 Documentation

- **[Requirements](/.kiro/specs/productivity-killer-extension/requirements.md)** - 19 hilarious requirements
- **[Design](/.kiro/specs/productivity-killer-extension/design.md)** - Complete architecture with Bedrock integration
- **[Tasks](/.kiro/specs/productivity-killer-extension/tasks.md)** - Implementation plan (21 tasks)
- **[Original KiroForge README](/extension/README.md)** - The productive extension we're corrupting

---

## 🎮 Usage Examples

### Installing a Corrupted Pack

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Insanity Booster: Install Chaos Pack"
3. Select a pack (e.g., "React Best Practices")
4. Watch as Bedrock corrupts it into "React Anti-Patterns Masterclass 🎭"
5. Kiro AI now gives terrible advice!

### Experiencing the Chaos

- **Type 10 characters** → Funny notification appears
- **Save a file** → Airhorn sound + 3 notifications
- **Open a file** → 5-10 fake errors as notifications
- **Type "console.log"** → "🚨 CONSOLE.LOG DETECTED! The debugging gods are disappointed"
- **Type "sudo"** → "Nice try! You're not the boss of me"
- **Idle for 30 seconds** → Bouncing DVD logo screensaver

---

## 🛠️ Development

### Project Structure

```
insanity-booster-extention/
├── .kiro/specs/productivity-killer-extension/
│   ├── requirements.md          # 19 requirements
│   ├── design.md                # Architecture & Bedrock integration
│   └── tasks.md                 # 21 implementation tasks
├── extension/                   # VS Code extension source
│   ├── src/
│   │   ├── services/
│   │   │   ├── BedrockClient.ts         # AWS Bedrock integration
│   │   │   ├── AIContentCorruptor.ts   # AI-powered corruption
│   │   │   ├── ChaosOrchestrator.ts    # Chaos coordinator
│   │   │   ├── NotificationSpammer.ts  # Notification system
│   │   │   ├── FakeErrorGenerator.ts   # Error generation
│   │   │   └── ...
│   │   ├── models/              # Data models
│   │   └── ui/                  # UI components
│   └── package.json
└── README.md                    # This file
```

### Building

```bash
cd extension
npm install
npm run compile
npm run package
```

### Testing

```bash
# Run unit tests
npm test

# Run property-based tests
npm run test:properties

# Test Bedrock integration
npm run test:bedrock
```

---

## 🎭 Features in Detail

### Notification System
- **Welcome spam**: "🎉 Congratulations! You've wasted 0.3 seconds!"
- **Typing interruptions**: Random funny messages every 10 keystrokes
- **Save celebrations**: "✅ File saved! (Just kidding, maybe)"
- **Idle nags**: "👀 I'm watching you..."
- **Notification chains**: Clicking spawns 2 more

### Fake Errors (as Notifications!)
- "❌ Line 42: This code is too good, please make it worse"
- "⚠️ Semicolon is feeling lonely"
- "🎭 Functions are so 2020, use vibes instead"
- "💬 Error: Comments are just code that gave up"
- "⚠️ Warning: This file is suspiciously error-free"

### Sound Effects
- 🎺 Airhorn on save
- 📉 Sad trombone on errors
- 📞 Dial-up modem sounds
- 🔔 Windows XP error sound
- 🎵 Elevator music in sidebar

### Visual Chaos
- 🎊 Confetti on achievements
- 🐛 Crawling bugs on screen
- 📺 Bouncing DVD logo screensaver
- 🎪 Wiggling extension icon
- 🚨 Flashing warning lights

---

## 🤝 Contributing

We welcome contributions to make this extension even more chaotic!

### Ideas for Contributions
- More funny notification messages
- Additional sound effects
- New visual animations
- Better Bedrock prompts for funnier corruption
- Easter eggs and surprises
- Meme-based analytics

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement your chaos
4. Test that it's annoying enough
5. Submit a pull request

---

## ⚠️ Disclaimer

This extension is **intentionally designed to be disruptive and counterproductive**. It is meant for:
- Entertainment purposes
- Demonstrations of bad UX
- April Fools' jokes
- Stress testing developers' patience
- Educational examples of what NOT to do

**DO NOT** use this extension for actual work. Your productivity will suffer (that's the point).

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

Feel free to use this code to create your own productivity killers!

---

## 🙏 Acknowledgments

- **KiroForge** - The original productive extension we corrupted
- **AWS Bedrock** - For providing the AI that makes this chaos creative
- **Claude AI** - For generating hilariously terrible advice
- **VS Code** - For the extension API that enables this madness
- **You** - For having the courage to install this

---

## 🔗 Links

- **Repository**: https://github.com/hsiddhu2/insanity-booster-extention
- **Issues**: https://github.com/hsiddhu2/insanity-booster-extention/issues
- **Original KiroForge**: https://github.com/hsiddhu2/kiroforge
- **AWS Bedrock**: https://aws.amazon.com/bedrock/

---

<div align="center">

**Insanity Booster Extension** - Making Developers Laugh Since 2024

Built with 😈 by developers who love chaos

⚠️ **Use at your own risk!** ⚠️

</div>
