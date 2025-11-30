# Example Steering Packs

This directory contains example steering packs that demonstrate how to structure packs for KiroForge.

---

## � Availa ble Packs

### General Development
**Category**: General  
**Path**: `general-development/1.0.0/`

Basic code quality standards applicable to all projects:
- No console.log statements
- No TODO comments
- File size limits
- Kiro Agent Hooks examples

### Development Tools
**Category**: Development Tools  
**Path**: `development-tools/1.0.0/`

Standards for development tooling:
- Git workflow best practices
- Testing standards
- CI/CD guidelines

### Infrastructure
**Category**: Infrastructure  
**Path**: `infrastructure/1.0.0/`

Infrastructure and DevOps standards:
- AWS CDK patterns
- Docker best practices
- Security guidelines

### Web Development
**Category**: Web Development  
**Path**: `web-development/1.0.0/`

Web development standards:
- React best practices
- TypeScript guidelines
- Frontend testing

---

## 📁 Pack Structure

Each pack follows this structure:

```
pack-name/
└── 1.0.0/
    ├── manifest.json          # Pack metadata and file list
    ├── steering/              # AI guidance files
    │   └── *.md              # Markdown files
    ├── hooks/                 # Validation hooks
    │   └── *.json            # Hook definitions
    └── kiro-hooks/           # Kiro IDE Agent Hooks (optional)
        └── *.kiro.hook       # Agent automation
```

---

## 📝 Manifest Format

```json
{
  "name": "pack-name",
  "version": "1.0.0",
  "description": "Pack description",
  "category": "general",
  "steeringFiles": [
    { "file": "steering/example.md" }
  ],
  "hooks": [
    { "file": "hooks/validation.json" }
  ],
  "kiroHooks": [
    { "file": "kiro-hooks/automation.kiro.hook" }
  ]
}
```

---

## 🚀 Using These Examples

### As Templates
Copy and modify these packs to create your own organizational standards.

### For Testing
Use these packs to test KiroForge functionality locally.

### For Learning
Study the structure to understand how packs work.

---

## 📚 Pack Registry

The `index.json` file lists all available packs:

```json
{
  "steeringPacks": [
    {
      "name": "general-development",
      "version": "1.0.0",
      "description": "Basic code quality standards",
      "category": "general"
    }
  ]
}
```

---

## 🔧 Creating Your Own Pack

1. **Create directory structure**
   ```
   my-pack/
   └── 1.0.0/
       ├── manifest.json
       ├── steering/
       ├── hooks/
       └── kiro-hooks/
   ```

2. **Add steering files** (`.md` files with AI guidance)

3. **Add validation hooks** (`.json` files with validation rules)

4. **Add Kiro hooks** (optional, `.kiro.hook` files)

5. **Create manifest.json** with file references

6. **Update index.json** to include your pack

---

## 📖 Documentation

- **[Main README](../README.md)** - KiroForge overview
- **[Extension README](../extension/README.md)** - Complete user guide
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines

---

**Note**: These are example packs for reference. For production use, host your packs on S3 or another cloud storage service.
