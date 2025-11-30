# KiroForge v1.2.1 Installation Guide

## 📋 Overview

KiroForge v1.2.1 is a production-ready Kiro IDE extension for code quality validation with steering packs and validation hooks.

---

## 📦 INSTALLATION IN KIRO IDE

**File**: `kiroforge-1.2.1.vsix`  
**Status**: ✅ Production Ready

### Quick Install Steps

1. **Uninstall old version** (if installed)
   - Open Extensions panel in Kiro IDE (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - Find KiroForge
   - Click Uninstall

2. **Install v1.2.1 in Kiro IDE**
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type: `Extensions: Install from VSIX`
   - Select: `extension/kiroforge-1.2.1.vsix`

3. **Reload Kiro IDE window**
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type: `Developer: Reload Window`

---

## ✅ VERIFICATION

After installation, verify the extension is working:

1. **Check Extension Panel**
   - Open Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - Find KiroForge
   - Version should show "1.2.1"

2. **Test Validation**
   - Open a code file
   - Save the file (triggers validation)
   - Check for violations in Problems panel

---



## 🎯 KEY FEATURES

### Code Quality Validation
- Real-time validation with steering packs
- Customizable validation hooks
- Team-wide code standards enforcement

### Performance
- Fast validation (< 500ms for typical files)
- Optimized for large codebases
- Low CPU and memory usage

### Integration
- Seamless Kiro IDE integration
- Metrics collection and analytics
- Dashboard for team insights

---

## ⚙️ CONFIGURATION

You can adjust the line length limit in VS Code settings:

```json
{
  "kiroforge.hookTimeout": 500,  // milliseconds
  "kiroforge.maxFileSizeForValidation": 5000  // lines
}
```

**Note**: There's no setting for MAX_LINE_LENGTH (hardcoded to 1000 chars). If you need to validate longer lines, you'll need to modify the source code.

---

## 🐛 TROUBLESHOOTING

If you encounter issues:

1. **Check version**: Ensure you're running v1.2.1
   - Extensions panel → KiroForge → Version should show "1.2.1"

2. **Reload window**: Sometimes a reload is needed
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type: `Developer: Reload Window`

3. **Check console**: View extension logs
   - View → Output → Extension Host
   - Look for KiroForge messages

4. **Report issues**: If problems persist
   - Visit: https://github.com/hsiddhu2/kiroforge/issues
   - Include: Error messages, console logs, steps to reproduce

---

## 💡 BEST PRACTICES

### Code Quality
1. **Use steering packs** for team-wide standards
2. **Configure hooks** based on your project needs
3. **Review violations** regularly in Problems panel
4. **Keep code formatted** for better readability

### Performance
1. **Use code formatters** (Prettier, ESLint)
2. **Keep files modular** and focused
3. **Review metrics** in the dashboard
4. **Optimize based on insights**

---

## 🚀 NEXT STEPS

After installation:

1. **Explore Steering Packs**
   - View available packs in KiroForge panel
   - Install packs relevant to your project
   - Customize pack configurations

2. **Configure Hooks**
   - Enable/disable hooks as needed
   - Adjust hook settings
   - Create custom hooks for your team

3. **View Metrics**
   - Access the dashboard for analytics
   - Track code quality trends
   - Share insights with your team

---

## ✨ SUMMARY

**KiroForge v1.2.1 provides:**
- ✅ Real-time code quality validation
- ✅ Customizable steering packs and hooks
- ✅ Team-wide code standards enforcement
- ✅ Metrics collection and analytics
- ✅ Seamless Kiro IDE integration

**Install now and elevate your code quality!** 🎉

---

**File**: `extension/kiroforge-1.2.1.vsix`  
**Status**: ✅ Production Ready  
**Repository**: https://github.com/hsiddhu2/kiroforge
