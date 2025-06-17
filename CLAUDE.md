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

## Project Overview

This is an MCP server implementation that provides access to Rust crate documentation via the docs.rs JSON API. The project enables AI assistants to fetch and parse Rust documentation, making it easier to provide accurate information about Rust crates, their APIs, and usage. The server includes intelligent caching and supports fetching documentation for specific crate versions and items.

## Essential Commands

- **Format code**: `bun run lint:fix`
- **Build project**: `bun run build` (current platform) or `bun run build:all` (all platforms) or `bun run build:bytecode` (bytecode, fastest startup performance)
- **Run tests**: `bun test` or `bun test --watch`
- **Run linter**: `bun run lint`
- **Type check**: `bun run typecheck`
- **Run specific test**: `bun test test_name`
- **Run with verbose output**: `DEBUG=mcp:* bun run src/cli.ts`
- **Clean cache**: `rm -rf ~/.cache/mcp-docsrs` (Adjust to the correct dbPath, this is just the default. Check possible ENV DB_PATH, .env files and if not present ask the user for one to set it. Recommend ":memory:" for in-memory cache)

## Running the Application

- **Development**: `bun run src/cli.ts`
- **As MCP server**: Configure in your MCP client with the built executable
- **Test cache**: `bun run scripts/test-persistent-cache.ts`
- **Interactive testing**: run `DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector ./dist/mcp-docsrs` and let the user test the server and report back to you. Use this ONLY if you are sure that you need the user to test the server and when you cannot test it yourself.

## Important Guidelines

- Always run `bun run lint:fix` before finishing a task
- Ensure all tests pass with `bun test`
- Fix TypeScript errors with `bun run typecheck`
- Use descriptive variable and function names following TypeScript conventions
- Document logic with comments in the code
- When importing from our modules, use relative imports from `src/`
- Prefer Bun's built-in APIs over Node.js equivalents when available
- Handle errors gracefully with proper error types from `src/errors.ts`

## Configuration Files

- **Package Manager**: Bun (see `package.json`)
- **TypeScript**: `tsconfig.json` (strict mode, ES2024 target)
- **Formatting/Linting**: `biome.json` (tab indentation, 100 char width)
- **Cache Storage**: Default in `~/.cache/mcp-docsrs/` directory
- **Build Outputs**: Executables in `dist/` directory

## Available MCP Servers

- mcp-interactive to ask questions about the task to the user. Do not use interactive mode if the user is on macOS since it is currently broken.
- context7 to retrieve in repository documentation files from many external repos. If its not there you can also ask the user to add it manually. Use it to answer questions about external dependencies first.
- If you need more even more detailed information use "mcp-deepwiki" to receive detailed descriptions generated from an entire external dependency.

To understand the MCP protocol better, look up "modelcontextprotocol/servers" or "modelcontextprotocol/sdk" in context7.

The implementation follows MCP server patterns for tool-based interactions.

### Key components

- `server.ts`: MCP server implementation with tool handlers
- `cache.ts`: LRU cache with SQLite persistence for API responses
- `docs-fetcher.ts`: HTTP client for docs.rs JSON API
- `rustdoc-parser.ts`: Parser for rustdoc JSON format
- `types.ts`: Zod schemas and TypeScript types
- `errors.ts`: Error handling and logging
- `cli.ts`: CLI entry point
- `index.ts`: Entry point for the MCP server

Do not use any external MCP server packages unless explicitly required. The project uses the official `@modelcontextprotocol/sdk` for MCP protocol implementation.

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less. Do not deviate from the instructions.
- ALWAYS create a copy of the file you are editing before making changes and name it with the suffix `-copy`. Then ask the user if you should keep the copy or the original file. If you are keeping the copy, delete the original file and rename the copy to the original file name.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
