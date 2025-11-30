# KiroForge Extension Tests

This directory contains tests for the KiroForge VS Code extension.

## Test Structure

```
__tests__/
├── setup.ts                    # Test environment setup and VS Code API mocks
├── unit/                       # Unit tests for individual services
│   ├── PackManager.test.ts
│   ├── HookRegistry.test.ts
│   ├── MetricsCollector.test.ts
│   ├── AnalyticsService.test.ts
│   └── StorageManager.test.ts
└── properties/                 # Property-based tests
    ├── pack-installation.test.ts
    ├── validation.test.ts
    ├── metrics.test.ts
    ├── analytics.test.ts
    └── configuration.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- PackManager.test.ts

# Run property-based tests only
npm test -- properties/
```

## Property-Based Testing

Property-based tests use `fast-check` to generate random inputs and verify that properties hold for all inputs.

Each property test:
- Runs 100 iterations minimum
- Is tagged with the property number and requirements it validates
- Tests universal properties ("for any...")

Example:
```typescript
// Feature: kiroforge-deep-dive, Property 1: Pack Installation Completeness
test('all pack files are downloaded and saved', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string(),
        version: fc.string(),
        steeringFiles: fc.array(fc.string()),
      }),
      async (pack) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

## Test Guidelines

1. **Unit Tests**: Test individual methods in isolation with mocked dependencies
2. **Property Tests**: Test universal properties across many random inputs
3. **Mocking**: Use Jest mocks for VS Code API and external dependencies
4. **Assertions**: Use clear, descriptive assertions
5. **Coverage**: Aim for >80% code coverage on critical paths
