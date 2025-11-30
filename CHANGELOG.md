# Changelog

All notable changes to the KiroForge extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-11-22

### Added
- **Kiro IDE Agent Hooks Support**: Full integration with Kiro IDE automation system
  - New "Kiro Agent Hooks" sidebar view for managing automation hooks
  - Automatic installation of `.kiro.hook` files from steering packs
  - Hooks stored in `.kiro/hooks/` directory (separate from validation hooks)
  - Support for multiple trigger types (onMessageSend, onSessionStart, onFileSave, onAgentComplete)
  - Click to open and edit hook files directly in editor
  - Filename validation enforcing `xxx-xxx.kiro.hook` pattern
  - New storage methods: `saveKiroHook()`, `readKiroHook()`, `deleteKiroHook()`, `listKiroHooks()`
  - HTTP method: `downloadKiroHook()` for fetching from S3
  - Commands: `refreshKiroHooksTree`, `openKiroHookFile`

### Changed
- **Welcome Messages**: Standardized empty state messages across all views
  - Fixed grammar: "No steering installed" (not "steerings")
  - Changed "No hooks installed" to "No skills installed" in Quality Skills view
  - Added "Install Packs" call-to-action buttons to all empty views
  - Consistent formatting and messaging
- **Repository Structure**: Cleaned up for professional GitHub presence
  - Removed development documents from root
  - Simplified README with architecture diagrams
  - Renamed `sample-steering/` to `examples/`
  - Removed `archive/` and `docs/` directories
  - Updated all GitHub links from `navy-team` to `hsiddhu2`

### Improved
- **Documentation**: Comprehensive improvements
  - Added visual architecture diagrams (ASCII art)
  - Added analytics architecture diagram
  - Added metrics collection flow diagram
  - Simplified and focused on user-facing content
  - Better organization and navigation
- **Package Optimization**: Cleaned build artifacts
  - Removed old VSIX files (1.2.2, 1.2.3, 1.2.4, 1.2.5)
  - Removed obsolete `out/` directory
  - Optimized package size to 407 KB
- **Examples Directory**: Cleaned and simplified
  - Removed development scripts (UPLOAD-TO-S3.sh, VERIFY-UPLOAD.sh)
  - Removed CHANGES-SUMMARY.md
  - Created clean, user-friendly README

### Fixed
- Inconsistent welcome messages across tree views
- Missing call-to-action buttons in empty views
- Incorrect GitHub repository links

## [1.2.2] - 2025-11-21

### Added
- **Kiro Insights**: Comprehensive productivity analytics dashboard
  - Average interactions per session tracking
  - Session depth analysis (shallow, medium, deep, very deep)
  - Tool usage patterns with percentage-based metrics
  - Activity patterns (hourly, daily, weekly)
  - Productivity insights (most productive hours/days)
  - Workspace-specific analytics with clickable navigation
- **Export Functionality**: Export analytics data to JSON
- **Status Bar Integration**: Quick access to insights from status bar
- **Insights Commands**: New commands for refreshing and exporting analytics

### Changed
- **Simplified UI**: Streamlined metrics focusing on actionable insights
- **Percentage-based Metrics**: All activity patterns now show percentages instead of raw counts
- **Project Structure**: Organized analytics research scripts and documentation into dedicated directories
- **Documentation**: Comprehensive updates to README and project documentation

### Improved
- Enhanced analytics calculations for better accuracy
- Better workspace filtering and navigation
- Improved error handling and logging
- More intuitive insights visualization

### Fixed
- Session counting methodology for accurate metrics
- Workspace filtering issues
- Icon cleanup and consistency
- Offline metrics handling

## [1.2.1] - 2024-11-18

### Fixed
- Bug fixes and performance improvements
- Enhanced metrics collection reliability
- Improved offline support stability

## [1.2.0] - 2024-11-15

### Added
- Metrics collection with offline queue
- Team detection from Git configuration
- Exponential backoff retry for offline metrics
- Persistent metrics queue across VS Code restarts

### Changed
- Real-time validation improvements
- Enhanced hook system performance

### Fixed
- Various bug fixes and stability improvements

## [1.1.0] - 2024-11-10

### Added
- Real-time validation as you type
- Configurable validation delay (100-5000ms)
- File size limits for validation (1000-50000 lines)
- Hook timeout configuration (500-10000ms)
- Maximum file size setting for performance

### Changed
- Improved validation performance with debouncing
- Better handling of large files

## [1.0.0] - 2024-11-15

### Added
- Initial release of KiroForge extension
- Steering pack management
  - Install organizational coding standards
  - Support for multiple pack categories
  - Pack refresh and update functionality
- Hook validation system
  - Regex validation
  - Filename validation
  - Filesize validation
- Metrics collection
  - Anonymous usage metrics
  - Privacy-focused (hashed IDs, no source code)
  - Opt-out capability
- VS Code integration
  - Problems panel integration
  - Command palette commands
  - Settings configuration
- Three-view sidebar
  - Approved Steering view
  - Quality Skills view
  - Kiro Insights view (basic)

### Features
- Real-time code validation
- Organizational standards enforcement
- Security vulnerability detection
- Code quality metrics tracking
- Team collaboration support
- Offline metrics queue
- Configurable validation settings

---

## Release Notes

### Version 1.2.2 Highlights

This release focuses on productivity analytics and user experience improvements:

**Kiro Insights Dashboard**: A comprehensive analytics system that helps you understand your productivity patterns, including session depth, tool usage, and activity patterns.

**Simplified UI**: Streamlined the interface to focus on actionable insights with percentage-based metrics that are easier to understand and compare.

**Better Organization**: Reorganized project structure with dedicated directories for analytics research and documentation, making the codebase more maintainable.

**Export Functionality**: Export your productivity data to JSON for further analysis with your preferred tools.

### Upgrade Notes

#### From 1.2.1 to 1.2.2
- No breaking changes
- New Kiro Insights features are automatically available
- Existing configurations remain compatible
- Analytics data is calculated from existing Kiro logs

#### From 1.2.0 to 1.2.1
- No breaking changes
- Improved stability and performance

#### From 1.1.0 to 1.2.0
- No breaking changes
- New metrics collection features are opt-in
- Team detection is automatic from Git config

#### From 1.0.0 to 1.1.0
- No breaking changes
- New validation settings are optional
- Default values maintain previous behavior

---

## Future Releases

### Planned for 1.4.0
- AST-based validation hooks
- Enhanced analytics visualizations
- Custom pack creation tools
- Hook templates and marketplace

### Under Consideration
- Integration with other IDEs
- Cloud-based pack registry
- AI-powered code suggestions
- Advanced analytics export formats

---

For more details on each release, see the [release notes](extension/docs/RELEASE-NOTES-v1.2.2.md).
