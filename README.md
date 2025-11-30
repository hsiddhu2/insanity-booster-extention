# KiroForge

**The Code Quality Platform for Development Teams** - Enforce organizational standards, automate workflows, and track productivity insights in your IDE.

[![Version](https://img.shields.io/badge/version-1.3.0-blue)](https://github.com/hsiddhu2/kiroforge/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-orange)](https://code.visualstudio.com/)

---

## Features

### 🎯 Kiro Agent Hooks
Automate your workflow with IDE hooks that trigger on events:
- `onMessageSend` - When sending messages to Kiro
- `onSessionStart` - When starting a new session  
- `onFileSave` - When saving files
- `onAgentComplete` - When agent execution completes

### ✅ Code Quality Standards
- Install organizational steering packs
- Real-time code validation
- Security vulnerability detection
- Custom validation rules

### 📊 Productivity Analytics
- Track interactions and chat sessions
- Analyze tool usage patterns
- View activity patterns (hourly, daily, weekly)
- Export analytics data

### 👥 Team Collaboration
- Collect team metrics
- Track code quality across teams
- Offline support with automatic sync

---

## Quick Start

### Installation

1. Download `kiroforge-1.3.0.vsix` from [Releases](https://github.com/hsiddhu2/kiroforge/releases)
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click "..." → "Install from VSIX..."
5. Select the downloaded file

### Configuration

Get your configuration values from AWS CloudFormation Outputs after deploying the backend:

```json
{
  "kiroforge.apiUrl": "your-api-gateway-url",
  "kiroforge.packsUrl": "your-s3-bucket-url",
  "kiroforge.apiKey": "your-api-key"
}
```

### Usage

1. Open Command Palette (Ctrl+Shift+P)
2. Run "KiroForge: Install Steering Packs"
3. Select packs to install
4. Start coding - validation happens automatically!

---

## What's New in v1.3.0

- 🎯 **Kiro Agent Hooks Support** - Full integration with automation system
- ✨ **UI Improvements** - Consistent welcome messages and terminology
- 📦 **Optimized Package** - 407 KB with cleaned build artifacts

[View Full Changelog](CHANGELOG.md)

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         KiroForge Extension                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ PackManager  │───▶│ HttpClient   │───▶│   AWS S3     │     │
│  │              │    │              │    │  (Packs URL) │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │StorageManager│                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────┐          │
│  │         .kiro/ Directory Structure                │          │
│  │  ┌────────────────────────────────────────────┐  │          │
│  │  │ steering/                                   │  │          │
│  │  │   └── *.md (AI guidance files)            │  │          │
│  │  │                                            │  │          │
│  │  │ kiroforge/                                 │  │          │
│  │  │   └── hooks/                               │  │          │
│  │  │       └── *.json (validation rules)       │  │          │
│  │  │                                            │  │          │
│  │  │ hooks/                                     │  │          │
│  │  │   └── *.kiro.hook (agent automation)     │  │          │
│  │  └────────────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ HookRegistry │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Real-Time Validation                      │          │
│  │  ┌────────────────────────────────────────────┐  │          │
│  │  │ • Regex validation                          │  │          │
│  │  │ • Filename validation                       │  │          │
│  │  │ • Filesize validation                       │  │          │
│  │  │ • AST validation (planned)                  │  │          │
│  │  └────────────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────┐          │
│  │         VS Code Problems Panel                    │          │
│  │  (Displays violations as diagnostics)             │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pack Installation Flow

1. **Discover** - Fetch available packs from S3
2. **Select** - Choose packs to install
3. **Download** - Get steering files, validation hooks, and agent hooks
4. **Install** - Save files to `.kiro/` directory
5. **Activate** - Register hooks for real-time validation

### Real-Time Validation

1. **Trigger** - User saves a file or types code
2. **Match** - Find applicable validation hooks
3. **Execute** - Run regex, filename, or filesize checks
4. **Report** - Display violations in Problems panel

### Analytics Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kiro Insights & Analytics                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ Insights UI  │───▶│  Analytics   │───▶│  Log Parser  │     │
│  │ (Tree View)  │    │   Service    │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    │                    │             │
│         │                    │                    ▼             │
│         │                    │            ┌──────────────┐     │
│         │                    │            │ File System  │     │
│         │                    │            │              │     │
│         │                    │            └──────────────┘     │
│         │                    │                    │             │
│         │                    │                    ▼             │
│         │                    │            ┌──────────────┐     │
│         │                    │            │  Kiro Logs   │     │
│         │                    │            │ ~/.kiro/logs/│     │
│         │                    │            └──────────────┘     │
│         │                    │                                  │
│         │                    ▼                                  │
│         │            ┌──────────────────────────────┐          │
│         │            │   Analytics Processing       │          │
│         │            │  ┌────────────────────────┐  │          │
│         │            │  │ • Parse sessions       │  │          │
│         │            │  │ • Parse interactions   │  │          │
│         │            │  │ • Parse tool usage     │  │          │
│         │            │  │ • Calculate metrics    │  │          │
│         │            │  │ • Identify patterns    │  │          │
│         │            │  └────────────────────────┘  │          │
│         │            └──────────────────────────────┘          │
│         │                    │                                  │
│         ▼                    ▼                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Insights Display                          │          │
│  │  ┌────────────────────────────────────────────┐  │          │
│  │  │ • Interactions per session                 │  │          │
│  │  │ • Chat sessions count                      │  │          │
│  │  │ • Tool usage percentages                   │  │          │
│  │  │ • Activity patterns (hourly/daily/weekly)  │  │          │
│  │  │ • Productivity insights                    │  │          │
│  │  │ • Workspace-specific analytics             │  │          │
│  │  └────────────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Status Bar & Export                       │          │
│  │  • Quick insights in status bar                   │          │
│  │  • Export analytics to JSON                       │          │
│  │  • Clickable workspace navigation                 │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                    Metrics Collection Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Events     │───▶│   Metrics    │───▶│ HTTP Client  │     │
│  │ (Hook runs,  │    │  Collector   │    │              │     │
│  │  Pack ops)   │    │              │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                              │                    │             │
│                              │                    ▼             │
│                              │            ┌──────────────┐     │
│                              │            │  Backend API │     │
│                              │            │  (Metrics)   │     │
│                              │            └──────────────┘     │
│                              │                    │             │
│                              ▼                    │             │
│                      ┌──────────────┐            │             │
│                      │ Offline Queue│            │             │
│                      │ (if offline) │            │             │
│                      └──────────────┘            │             │
│                              │                    │             │
│                              └────────────────────┘             │
│                                     │                           │
│                                     ▼                           │
│                      ┌──────────────────────────┐              │
│                      │  Automatic Retry         │              │
│                      │  • Exponential backoff   │              │
│                      │  • Persistent queue      │              │
│                      │  • Manual retry option   │              │
│                      └──────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
.kiro/
├── steering/              # AI guidance (read by Kiro IDE)
│   └── *.md              # Markdown files with coding standards
│
├── kiroforge/            # KiroForge data
│   └── hooks/            # Validation hooks
│       └── *.json        # Code quality rules
│
└── hooks/                # Kiro IDE Agent Hooks
    └── *.kiro.hook       # Automation triggers
```

---

## Documentation

- **[Extension README](extension/README.md)** - Complete user guide
- **[Quick Start](extension/QUICK-START.md)** - 5-minute setup
- **[Installation Guide](extension/INSTALL.md)** - Detailed instructions
- **[Changelog](CHANGELOG.md)** - Version history
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines

---

## Repository Structure

```
kiroforge/
├── extension/              # VS Code extension source
│   ├── src/               # TypeScript source code
│   ├── dist/              # Compiled extension
│   ├── docs/              # Feature documentation
│   └── README.md          # User documentation
├── sample-steering/       # Example steering packs
├── LICENSE                # MIT License
└── README.md             # This file
```

---

## Development

### Build

```bash
cd extension
npm install
npm run compile
```

### Package

```bash
cd extension
npx vsce package
```

### Test

```bash
cd extension
npm test
```

---

## Community & Support

### 🌟 Join the KiroForge Community

KiroForge is built by developers, for developers. We're creating the future of code quality tooling together.

- **💬 Discussions**: [Share ideas and get help](https://github.com/hsiddhu2/kiroforge/discussions)
- **🐛 Issues**: [Report bugs and request features](https://github.com/hsiddhu2/kiroforge/issues)
- **📖 Documentation**: [Complete guides](extension/README.md)
- **⭐ Star us**: Show your support on [GitHub](https://github.com/hsiddhu2/kiroforge)

### 🤝 Contributing

We welcome contributions! Whether it's:
- Creating new steering packs
- Improving documentation
- Fixing bugs
- Suggesting features

Check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Links

- **Repository**: https://github.com/hsiddhu2/kiroforge
- **Releases**: https://github.com/hsiddhu2/kiroforge/releases
- **Documentation**: [extension/README.md](extension/README.md)
- **Community**: [GitHub Discussions](https://github.com/hsiddhu2/kiroforge/discussions)

---

<div align="center">

**KiroForge** - The Code Quality Platform for Development Teams

[![GitHub Stars](https://img.shields.io/github/stars/hsiddhu2/kiroforge?style=social)](https://github.com/hsiddhu2/kiroforge)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.3.0-blue)](https://github.com/hsiddhu2/kiroforge/releases)

Built with ❤️ by the Kiro developer community

</div>
