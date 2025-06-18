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
- **Build project**:
  - `bun run build` (current platform)
  - `bun run build:all` (all 7 platforms + bytecode)
  - `bun run build:bytecode` (universal bytecode, fastest startup)
  - Platform-specific: `bun run build:linux-x64`, `build:linux-arm64`, `build:linux-x64-musl`, `build:linux-arm64-musl`, `build:darwin-x64`, `build:darwin-arm64`, `build:windows-x64`
- **Run tests**: `bun test` or `bun test --watch`
- **Run linter**: `bun run lint`
- **Type check**: `bun run typecheck`
- **Run specific test**: `bun test test_name`
- **Run with verbose output**: `DEBUG=mcp:* bun run src/cli.ts`
- **Clean cache**: `rm -rf ~/.mcp-docsrs/cache.db` (Adjust to the correct dbPath directory. The cache.db file will be created inside the specified directory. Check possible ENV DB_PATH, .env files and if not present ask the user for one to set it. Recommend ":memory:" for in-memory cache)

## Running the Application

- **Development**: `bun run src/cli.ts`
- **As MCP server**: Configure in your MCP client with the built executable
- **Interactive testing**: run `bun inspector` and let the user test the server and report back to you. Use this ONLY if you are sure that you need the user to test the server and when you cannot test it yourself.

## Important Guidelines

- Ensure all tests pass with `bun test`
- Fix TypeScript errors with `bun run typecheck`
- Use descriptive variable and function names following TypeScript conventions
- Document logic with comments in the code
- Prefer Bun's built-in APIs over Node.js equivalents when available
- Handle errors gracefully with proper error types from `src/errors.ts`

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
- At the end of any task, make sure to lint, typecheck, run tests and finally build the code using `build:bytecode`.

## Platform Support

The project supports building for 7 different platforms plus a universal bytecode version:

### Linux Targets

- **linux-x64**: Standard x64 Linux with GLIBC (Ubuntu, Debian, Fedora)
- **linux-arm64**: ARM64 Linux with GLIBC (AWS Graviton, modern ARM servers)
- **linux-x64-musl**: x64 Linux with MUSL for static linking (Alpine, containers)
- **linux-arm64-musl**: ARM64 Linux with MUSL for static linking

### macOS Targets

- **darwin-x64**: Intel-based Macs
- **darwin-arm64**: Apple Silicon Macs (M1/M2/M3)

### Windows Target

- **windows-x64**: 64-bit Windows

### Universal Target

- **bytecode**: Platform-agnostic bytecode that runs on any system with Bun installed

When building, prefer MUSL variants for Docker containers and maximum compatibility. Use GLIBC variants for standard Linux distributions where performance is critical.

## Memories

- Bun uses bun.lock now not bun.lockb anymore
