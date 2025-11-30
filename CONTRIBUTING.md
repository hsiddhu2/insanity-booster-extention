# Contributing to KiroForge

Thank you for your interest in contributing to KiroForge! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites
- Node.js 16+
- VS Code 1.74.0+
- npm
- Git

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/hsiddhu2/kiroforge.git
   cd kiroforge
   ```

2. **Install dependencies**
   ```bash
   cd extension
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run compile
   ```

4. **Run in development mode**
   ```bash
   npm run watch
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tooling changes

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

## Code Style

### TypeScript Guidelines
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Example
```typescript
/**
 * Validates a steering pack configuration
 * @param pack - The pack to validate
 * @returns True if valid, false otherwise
 */
function validatePack(pack: Pack): boolean {
  if (!pack.name || !pack.version) {
    return false;
  }
  return true;
}
```

## Testing

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Writing Tests
- Write tests for all new features
- Test edge cases and error conditions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Example
```typescript
describe('PackManager', () => {
  it('should install pack successfully', async () => {
    // Arrange
    const manager = new PackManager();
    const pack = { name: 'test-pack', version: '1.0.0' };
    
    // Act
    const result = await manager.installPack(pack);
    
    // Assert
    expect(result).toBe(true);
  });
});
```

## Documentation

### Updating Documentation
- Update README.md for user-facing changes
- Update PROJECT-README.md for architecture changes
- Add feature documentation in extension/docs/
- Update CHANGELOG.md with your changes

### Documentation Style
- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep documentation up to date with code

## Pull Request Guidelines

### Before Submitting
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console.log or debug statements
- [ ] No commented-out code

### PR Description
Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (for UI changes)
- Related issues

### Review Process
1. Automated checks must pass
2. At least one maintainer approval required
3. Address all review comments
4. Keep PR focused and small

## Project Structure

```
.
├── extension/
│   ├── src/              # Source code
│   │   ├── extension.ts  # Entry point
│   │   ├── services/     # Core services
│   │   ├── ui/           # UI components
│   │   ├── models/       # Data models
│   │   └── utils/        # Utilities
│   ├── test/             # Tests
│   ├── docs/             # Feature documentation
│   └── analytics-research/ # Research scripts
└── docs/                 # Development documentation
```

## Reporting Issues

### Bug Reports
Include:
- KiroForge version
- VS Code version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Additional context

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## Questions?

- Check the [documentation](extension/README.md)
- Review [existing issues](https://github.com/hsiddhu2/kiroforge/issues)
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to KiroForge! 🚀
