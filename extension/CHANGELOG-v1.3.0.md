# Changelog - Version 1.3.0

**Release Date**: November 22, 2024  
**Package**: `kiroforge-1.3.0.vsix` (407 KB)

---

## 🎯 New Features

### Kiro IDE Agent Hooks Integration

Full support for Kiro IDE's agent automation system:

- **New Sidebar View**: "Kiro Agent Hooks" displays all installed automation hooks
- **Automatic Installation**: Hooks are installed automatically when you install packs that include them
- **Easy Management**: Click any hook to open and edit in the editor
- **Proper Storage**: Hooks stored in `.kiro/hooks/` with `.kiro.hook` extension
- **Pack Integration**: Hooks are removed when you uninstall their parent pack

#### Technical Implementation

- New `KiroHooksTreeProvider` for displaying hooks in sidebar
- Storage methods: `saveKiroHook()`, `readKiroHook()`, `deleteKiroHook()`, `listKiroHooks()`
- HTTP method: `downloadKiroHook()` for fetching hooks from S3
- Filename validation: Enforces `xxx-xxx.kiro.hook` naming pattern
- Commands: `refreshKiroHooksTree`, `openKiroHookFile`

---

## ✨ UI/UX Improvements

### Consistent Welcome Messages

Fixed inconsistent and grammatically incorrect welcome messages across all tree views:

**Before:**
- Approved Steering: "No steerings installed." ❌
- Quality Skills: "No hooks installed." ❌ (confusing terminology)
- Kiro Agent Hooks: "No Kiro agent hooks installed." (no action button)

**After:**
- Approved Steering: "No steering installed.\n\n[Install Packs]" ✅
- Quality Skills: "No skills installed.\n\n[Install Packs]" ✅
- Kiro Agent Hooks: "No Kiro agent hooks installed.\n\n[Install Packs]" ✅

**Benefits:**
- Correct grammar (steering is uncountable)
- Clear terminology (skills vs hooks)
- Actionable buttons in all views
- Consistent formatting

---

## 🔧 Code Quality

### Cleanup

- Removed old VSIX files (1.2.2, 1.2.3, 1.2.4, 1.2.5)
- Removed obsolete `out/` directory (old TypeScript build output)
- Kept `analytics-research/` utilities for development
- Optimized package size to 407 KB

---

## 📦 Package Contents

The v1.3.0 package includes:

- **Extension Code**: 364 KB (minified production build)
- **Documentation**: 104 KB (24 files in `docs/`)
- **Analytics Research**: 140 KB (21 utility scripts)
- **Resources**: Icon and assets
- **Total**: 407 KB (56 files)

---

## 🔄 Migration from v1.2.x

No breaking changes. Simply install v1.3.0 and reload VS Code.

### What's New for Users

1. **New Sidebar View**: You'll see "Kiro Agent Hooks" in the KiroForge sidebar
2. **Automatic Hook Installation**: When you install packs with hooks, they'll appear in the new view
3. **Better Empty States**: All empty views now have helpful "Install Packs" buttons

### What Stays the Same

- All existing functionality works exactly as before
- Your installed packs and settings are preserved
- Validation hooks continue to work normally
- Analytics and insights unchanged

---

## 📝 Files Modified

### New Files (2)
1. `extension/src/models/KiroHook.ts` - Data models for Kiro hooks
2. `extension/src/ui/KiroHooksTreeProvider.ts` - Tree view provider

### Modified Files (6)
1. `extension/src/models/Pack.ts` - Added `kiroHooks` and `kiroHookFiles` support
2. `extension/src/utils/storage.ts` - Added 6 new methods for Kiro hooks management
3. `extension/src/utils/http.ts` - Added `downloadKiroHook()` method
4. `extension/src/services/PackManager.ts` - Integrated hooks in install/uninstall
5. `extension/src/extension.ts` - Registered tree view and commands
6. `extension/package.json` - Added views, commands, menus, and bumped version

---

## 🧪 Testing

### Compilation
✅ Webpack compiled successfully in 1581ms

### Package
✅ Created `kiroforge-1.3.0.vsix` (407 KB)

### Verification
- ✅ All TypeScript compiles without errors
- ✅ Package includes all necessary files
- ✅ No breaking changes to existing functionality
- ✅ Welcome messages display correctly
- ✅ Hooks are properly stored and retrieved

---

## 📚 Documentation Updates

- Updated `README.md` with v1.3.0 features
- Created `RELEASE-v1.3.0.md` with detailed release notes
- Created `TREE-VIEW-IMPROVEMENTS.md` documenting UI changes
- Updated version history in README

---

## 🐛 Bug Fixes

- Fixed inconsistent grammar in welcome messages
- Fixed confusing terminology ("hooks" vs "skills")
- Improved user onboarding with actionable buttons

---

## 🔮 Future Enhancements

Potential improvements for future versions:

1. **Hook Templates**: Pre-built hook templates for common automation tasks
2. **Hook Validation**: Validate hook syntax before saving
3. **Hook Testing**: Test hooks without triggering actual events
4. **Hook Marketplace**: Browse and install individual hooks
5. **Hook Analytics**: Track which hooks are most useful

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section in README
- Review extension logs in Output panel
- Report issues on GitHub

---

## 🙏 Acknowledgments

Thanks to the Kiro IDE team for the agent hooks specification and testing support.

---

**Full Changelog**: v1.2.2...v1.3.0
