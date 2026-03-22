# Contributing

Thanks for contributing to `mcp-docsrs`.

## Prerequisites

- Bun `v1.3.11`

## Development

```bash
bun install # Install dependencies
bun dev # Run in development mode
bun lint # Lint code
bun check # Type checking
```

## Build

```bash
bun run build # Build local target
bun run build -- list # Show the available targets
bun run build -- linux-x64 # Build one release target
bun run build -- linux-x64 --clean # Remove last build output before building
bun run build -- all # Build all available release targets
```

## Before you open a PR

- Check for an existing issue first.
- Open an issue before starting large features, API changes, or refactors.
- Keep pull requests small and focused.

## Commit messages

This repo uses conventional commits.

Examples:

```text
feat: add symbol path normalization
fix: handle missing rustdoc index entries
docs: simplify setup instructions
test: add coverage for invalid crate versions
```

## Pull requests

Your PR should clearly state:

- what changed
- why it changed
- how you tested it

Before requesting review, make sure the PR is scoped, readable, and passes all checks.
