# Testing

This project uses Bun's built-in test runner.

Every `bun test` run now produces a coverage summary, excludes test files from the coverage report, and fails if coverage drops below these thresholds:

- `90%` line coverage
- `90%` function coverage
- `90%` statement coverage

## Test Workflow

```bash
# Run all tests
bun test

# Run one test file
bun test src/server/tests/server.test.ts

# Run a test directory
bun test src/docs
bun test src/tools/crate
bun test src/server
```

## Coverage Behavior

Coverage is configured in [`bunfig.toml`](bunfig.toml):

```toml
[test]
coverage = true
coverageThreshold = { lines = 0.9, functions = 0.9, statements = 0.9 }
coverageSkipTestFiles = true
```

That means:

- `bun test` prints a coverage report without needing `--coverage`
- Bun ignores `*.test.*` files when calculating coverage totals
- the test run exits non-zero when coverage falls below the configured threshold

## Reading The Report

The Bun coverage summary shows one row per loaded source file plus an aggregate row:

- `% Funcs` tells you how many functions were executed
- `% Lines` tells you how many source lines were executed
- `Uncovered Line #s` highlights the lines that were not exercised

Coverage only applies to files that are loaded during the test run. If a module never appears in the report, no test imported it.

## Contribution Expectation

When you change runtime behavior:

- update or add the closest relevant test in the same area
- prefer direct unit-style coverage for parser, formatter, and tool behavior
- run the narrowest useful test target while iterating
- run `bun test` before finishing so the full coverage threshold is checked

If you introduce a new behavior and it is not practical to cover with the existing suite shape, add the missing test structure instead of leaving the gap behind.
