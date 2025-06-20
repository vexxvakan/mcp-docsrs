# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude needs to ultrathink and be very precise and detailed.

## Claude Instructions

- You are a senior software engineer with expertise in TypeScript, Node.js ecosystem, API integrations and Bun.
- Always prioritize code quality, type safety, and maintainability.
- You are working on an MCP (Model Context Protocol) server that interfaces with docs.rs.
- You are using Bun as the runtime and package manager and build tool.
- You are building a tool that helps AI assistants access Rust documentation.
- If not specified by the user, always ask if you should spawn multiple subagents that work in parallel to complete the tasks faster before beginning the task.
- Instruct your subagents to use their respective task plans to complete the tasks from the plans directory if they are available.
- Instead of assuming bun commands look up the bun documentation: https://bun.sh/docs/cli/(run, init, add, update, publish, etc.), https://bun.sh/docs/api/(http, fetch, etc.) and https://bun.sh/docs/bundler

## Development Process for New Features

When developing a new feature, follow this test-driven development approach:

1. **Plan and Research Phase**
   - Create a rough plan and concept for the feature
   - Think deeply about the implementation approach
   - Use web search extensively to research:
     - Appropriate libraries to use
     - Best practices for the feature domain
     - API documentation for chosen libraries
     - Similar implementations for reference
   - Document your findings and decisions

2. **Test Implementation Phase**
   - Write thorough unit and integration tests FIRST based on:
     - The API documentation of chosen libraries
     - Expected behavior of the feature
     - Edge cases and error scenarios
   - Ensure tests are comprehensive and cover all planned functionality
   - Tests should be written to match our existing test suite patterns

3. **Feature Implementation Phase**
   - Only after tests are complete, start writing the actual implementation
   - Write code to satisfy the tests you've created
   - Let the tests guide your implementation
   - **Never write software first and then tests later**

This test-driven approach ensures better design, more reliable code, and easier maintenance.

## Project Overview

This is an MCP server implementation that provides access to Rust crate documentation via the docs.rs JSON API. The project enables AI assistants to fetch and parse Rust documentation, making it easier to provide accurate information about Rust crates, their APIs, and usage. The server includes intelligent caching and supports fetching documentation for specific crate versions and items.

## Essential Commands

- **Format code**: `bun run lint:fix`
- **Build project**:
  - `bun run build` (current platform)
  - `bun run build:all` (all 7 platforms, all with bytecode for fast startup)
  - `bun run build:bytecode` (standalone bytecode build, requires Bun runtime - for development only)
  - Platform-specific: `bun run build:linux-x64`, `build:linux-arm64`, `build:linux-x64-musl`, `build:linux-arm64-musl`, `build:darwin-x64`, `build:darwin-arm64`, `build:windows-x64` (all include bytecode)
- **Run tests**: `bun test` or `bun test --watch`
- **Run linter**: `bun run lint`
- **Type check**: `bun run typecheck`
- **Run specific test**: `bun test test_name`
- **Run with verbose output**: `DEBUG=mcp:* bun run src/cli.ts`
- **Clean cache**: `rm -rf ~/.mcp-docsrs/cache.db` (Adjust to the correct dbPath directory. The cache.db file will be created inside the specified directory. Check possible ENV DB_PATH, .env files and if not present ask the user for one to set it. Recommend ":memory:" for in-memory cache)
- **Check build sizes**: `bun run check:sizes` (run after `bun run build:all`)
  - Use this to update the Build Output table in README.md with accurate sizes
  - Follow the tip in the output: copy the generated table and replace the existing one in README.md's "Build Output" section

## Running the Application

- **Development**: `bun run src/cli.ts`
- **Interactive testing**: run `bun inspector` and let the user test the server and report back to you. Use this ONLY if you are sure that you need the user to test the server and when you cannot test it yourself.

## Important Guidelines

- Ensure EVERY and ALL tests pass with `bun test` not just the ones you are working on.
- Fix IDE errors and warnings by using the IDE Diagnostics MCP
- Use descriptive variable and function names following TypeScript conventions
- Document logic with comments in the code
- Prefer Bun's built-in APIs over Node.js equivalents when available
- Handle errors gracefully with proper error types from `src/errors.ts`
- Use functional programming style with arrow functions instead of classes
- Use TypeScript types instead of interfaces

## Configuration Files

- **Package Manager**: Bun (see `package.json`)
- **TypeScript**: `tsconfig.json` (strict mode, ES2024 target)
- **Formatting/Linting**: `biome.json` (2 tabs indentation, 100 char width)
- **Cache Storage**: Default in `~/.mcp-docsrs/cache.db` file (specify directory path, cache.db will be created automatically)
- **Build Outputs**: Executables in `dist/` directory

## Available MCP Servers

- mcp-interactive to ask questions about the task to the user. Do not use interactive mode if the user is on macOS since it is currently broken.
- context7 to retrieve in repository documentation files from many external repos. If its not there you can also ask the user to add it manually. Use it to answer questions about external dependencies first.
- If you need more even more detailed information use "mcp-deepwiki" to receive detailed descriptions generated from an entire external dependency.

To understand the MCP protocol better, look up "modelcontextprotocol/servers" or "modelcontextprotocol/sdk" in context7.

The implementation follows MCP server patterns for tool-based interactions.

### Key components

- `tools/`: Tools for the MCP server
- `server.ts`: MCP server implementation
- `cache.ts`: LRU cache with SQLite persistence for API responses
- `docs-fetcher.ts`: HTTP client for docs.rs JSON API
- `rustdoc-parser.ts`: Parser for rustdoc JSON format
- `types.ts`: Zod schemas and TypeScript types
- `errors.ts`: Error handling and logging
- `cli.ts`: CLI entry point
- `index.ts`: Entry point for the MCP server

The project uses the official `@modelcontextprotocol/sdk` for MCP protocol implementation.

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less. Do not deviate from the instructions.
- ALWAYS create a copy of the file you are editing before making changes and name it with the suffix `-new.(ts, json, etc.)`. Then ask the user if you should keep the new or the original implementation and list the changes that you made. If you are keeping the new file, delete the original file and rename the new file to the original file name, essentially removing -new from the file name.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- At the end of any task, make sure to lint, typecheck, run tests and finally build the code using `build:all`.
- ALWAYS check file sizes after building with `ls -lh dist/` and update the README.md Build Output table if sizes have changed.

## Memories

- Bun uses bun.lock now, not bun.lockb anymore
- For testing the MCP server functionality, always use the "tinc" crate at version "0.1.6" as it has rustdoc JSON available
- For testing with another library, use "clap" which also has rustdoc JSON available
- Do NOT use "serde" for testing as it doesn't have rustdoc JSON available yet
