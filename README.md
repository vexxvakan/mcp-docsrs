# 🦀 MCP Rust Docs Server

[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io)
[![Rust Docs](https://img.shields.io/badge/docs.rs-Documentation-orange?style=for-the-badge&logo=rust)](https://docs.rs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2.14%2B-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

>A **Model Context Protocol** (MCP) server for **fetching Rust crate documentation** from [docs.rs](https://docs.rs) using the **rustdoc JSON API**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Building](#building) • [Development](#development) • [Notes](#notes) • [Contributing](#contributing) • [License](#license)

## ✨ Features
<a id="features"></a>

- 🚀 **Fast Documentation Fetching** - Direct access to rustdoc JSON API for comprehensive crate documentation
- 🔍 **Item-Level Lookup** - Query specific structs, functions, traits, and more within crates
- 💾 **Smart Caching** - Built-in LRU cache with SQLite backend for optimal performance
- 🎯 **Version Support** - Fetch docs for specific versions or use semver ranges
- 🖥️ **Cross-Platform** - Standalone executables for Linux, macOS, and Windows
- 📦 **Zero Dependencies** - Single executable with everything bundled
- 🔧 **TypeScript** - Full type safety with modern ES modules
- 🗜️ **Compression Support** - Automatic Zstd decompression for efficient data transfer

## 📦 Installation
<a id="installation"></a>

### Using npm/Bun

```bash
# Using npm
npm install

# Using Bun (recommended)
bun install
```

### Using Pre-built Executables

Download the latest release for your platform from the [Releases](https://github.com/your-repo/releases) page:

- **Linux**: `mcp-rust-docs-linux-x64`
- **macOS**: `mcp-rust-docs-darwin-x64`
- **Windows**: `mcp-rust-docs-windows-x64.exe`

## 🚀 Usage
<a id="usage"></a>

### Starting the Server

#### Using npm or Bun

```bash
# Production mode
npm start
# or
bun start

# Development mode with hot reload
npm run dev
# or
bun run dev
```

#### Using Executable

```bash
# Show help
./mcp-rust-docs --help

# Run with default settings
./mcp-rust-docs

# Run with custom configuration
./mcp-rust-docs --cache-ttl 7200000 --max-cache-size 200
```

### 🛠️ Available Tools

#### `lookup_crate_docs`

Fetches comprehensive documentation for an entire Rust crate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `crateName` | string | ✅ | Name of the Rust crate |
| `version` | string | ❌ | Specific version or semver range (e.g., "1.0.0", "~4") |
| `target` | string | ❌ | Target platform (e.g., "i686-pc-windows-msvc") |
| `formatVersion` | string | ❌ | Rustdoc JSON format version |

**Example:**

```json
{
  "tool": "lookup_crate_docs",
  "arguments": {
    "crateName": "serde",
    "version": "latest"
  }
}
```

#### `lookup_item_docs`

Fetches documentation for a specific item within a crate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `crateName` | string | ✅ | Name of the Rust crate |
| `itemPath` | string | ✅ | Path to the item (e.g., "struct.MyStruct", "fn.my_function") |
| `version` | string | ❌ | Specific version or semver range |
| `target` | string | ❌ | Target platform |

**Example:**

```json
{
  "tool": "lookup_item_docs",
  "arguments": {
    "crateName": "tokio",
    "itemPath": "runtime.Runtime"
  }
}
```

### ⚙️ Configuration

Configure the server using environment variables or command-line arguments:

| Variable | CLI Flag | Default | Description |
|----------|----------|---------|-------------|
| `CACHE_TTL` | `--cache-ttl` | 3600000 | Cache time-to-live in milliseconds |
| `MAX_CACHE_SIZE` | `--max-cache-size` | 100 | Maximum number of cached entries |
| `REQUEST_TIMEOUT` | `--request-timeout` | 30000 | HTTP request timeout in milliseconds |
| `DB_PATH` | `--db-path` | :memory: | Path to SQLite database file (use `:memory:` for in-memory) |

**Example:**

```bash
# Environment variables
CACHE_TTL=7200000 MAX_CACHE_SIZE=200 npm start

# Command-line arguments (executable)
./mcp-rust-docs --cache-ttl 7200000 --max-cache-size 200

# Use persistent database to cache documentation between sessions
./mcp-rust-docs --db-path ~/.mcp-rust-docs/cache.db

# Or with environment variable
DB_PATH=~/.mcp-rust-docs/cache.db npm start
```

### 🔌 MCP Configuration

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "rust-docs": {
      "command": "node",
      "args": ["/path/to/mcp-rust-docs/dist/index.js"]
    }
  }
}
```

Or using the executable:

```json
{
  "mcpServers": {
    "rust-docs": {
      "command": "/path/to/mcp-rust-docs"
    }
  }
}
```

<a id="building"></a>

## 🏗️ Building
<a id="building"></a>

### Prerequisites

- Bun v1.2.14 or later
- macOS, Linux, or Windows

### Build Commands

```bash
# Build for current platform
bun run build

# Build with bytecode compilation (faster startup)
bun run build:bytecode

# Build for all platforms
bun run build:all

# Platform-specific builds
bun run build:linux    # Linux x64
bun run build:macos    # macOS x64
bun run build:windows  # Windows x64
```

### Build Output

All executables are created in the `dist/` directory:

| File | Platform | Size |
|------|----------|------|
| `mcp-rust-docs` | Current platform | ~56MB |
| `mcp-rust-docs-linux-x64` | Linux x64 | ~56MB |
| `mcp-rust-docs-darwin-x64` | macOS x64 | ~56MB |
| `mcp-rust-docs-windows-x64.exe` | Windows x64 | ~57MB |

<a id="development"></a>

## 👨‍💻 Development
<a id="development"></a>

### Development Workflow

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Type checking
bun run typecheck
```

### Project Structure

```text
mcp-rust-docs/
├── src/
│   ├── index.ts        # Main entry point
│   ├── server.ts       # MCP server implementation
│   ├── tools.ts        # Tool definitions
│   ├── cache.ts        # Caching logic
│   └── types.ts        # TypeScript type definitions
├── dist/               # Build output
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

<a id="notes"></a>

## 📝 Notes
<a id="notes"></a>

- 📅 The rustdoc JSON feature on docs.rs started on **2025-05-23**, so releases before that date won't have JSON available
- 🔄 The server automatically handles redirects and format version compatibility
- ⚡ Cached responses significantly improve performance for repeated lookups
- 📦 Built executables include all dependencies - no runtime installation required

## 🤝 Contributing
<a id="contributing"></a>

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<a id="license"></a>

## 📄 License
<a id="license"></a>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Rust community

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues)
