# 🦀 MCP Rust Docs Server

[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io)
[![Rust Docs](https://img.shields.io/badge/docs.rs-Documentation-orange?style=for-the-badge&logo=rust)](https://docs.rs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2.14%2B-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-yellow.svg?style=for-the-badge?logo=apache)](https://opensource.org/licenses/Apache-2.0)

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

### Using Bun

```bash
bun install
bun run build:bytecode # or bun run build:all for all platforms
```

### Using Pre-built Executables

Download the latest release for your platform from the [Releases](https://github.com/vexxvakan/mcp-docsrs/releases) page:

#### Linux

- **x64/AMD64 (GLIBC)**: `mcp-docsrs-linux-x64` - For Ubuntu, Debian, Fedora, etc.
- **ARM64 (GLIBC)**: `mcp-docsrs-linux-arm64` - For ARM64 systems, AWS Graviton
- **x64/AMD64 (MUSL)**: `mcp-docsrs-linux-x64-musl` - For Alpine Linux, Docker containers (requires libstdc++)
- **ARM64 (MUSL)**: `mcp-docsrs-linux-arm64-musl` - For Alpine on ARM64, minimal containers (requires libstdc++)

#### macOS

- **Intel**: `mcp-docsrs-darwin-x64` - For Intel-based Macs
- **Apple Silicon**: `mcp-docsrs-darwin-arm64` - For M1/M2/M3 Macs

#### Windows

- **x64**: `mcp-docsrs-windows-x64.exe` - For 64-bit Windows

### Using Docker

Pull and run the latest multi-arch image (supports both x64 and ARM64):

```bash
# Pull the latest image
docker pull ghcr.io/vexxvakan/mcp-docsrs:latest

# Run the server
docker run --rm -i ghcr.io/vexxvakan/mcp-docsrs:latest

# Run with custom configuration
docker run --rm -i ghcr.io/vexxvakan/mcp-docsrs:latest \
  --cache-ttl 7200000 --max-cache-size 200
```

Available tags:
- `latest` - Latest stable release (multi-arch)
- `v1.0.0` - Specific version (multi-arch)
- `x64` - Latest x64/AMD64 build
- `arm64` - Latest ARM64 build

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
mcp-docsrs --help

# Run with default settings
mcp-docsrs

# Run with custom configuration
mcp-docsrs --cache-ttl 7200000 --max-cache-size 200
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

### 📊 Resources

The server provides resources for querying and inspecting the cache database:

#### `cache://stats`

Returns cache statistics including total entries, size, and oldest entry.

**Example:**

```json
{
  "totalEntries": 42,
  "totalSize": 1048576,
  "oldestEntry": "2024-01-15T10:30:00.000Z"
}
```

#### `cache://entries?limit={limit}&offset={offset}`

Lists cached entries with metadata. Supports pagination.

**Parameters:**

- `limit` - Number of entries to return (default: 100)
- `offset` - Number of entries to skip (default: 0)

**Example:**

```json
[
  {
    "key": "serde/latest/x86_64-unknown-linux-gnu",
    "timestamp": "2024-01-15T14:20:00.000Z",
    "ttl": 3600000,
    "expiresAt": "2024-01-15T15:20:00.000Z",
    "size": 524288
  }
]
```

#### `cache://query?sql={sql}`

Execute SQL queries on the cache database (SELECT queries only for safety).

**Example:**

```sql
cache://query?sql=SELECT key, timestamp FROM cache WHERE key LIKE '%tokio%' ORDER BY timestamp DESC
```

**Note:** SQL queries in the URI should be URL-encoded. The server will automatically decode them.

#### `cache://config`

Returns the current server configuration including all runtime parameters.

**Example response:**

```json
{
  "cacheTtl": 7200000,
  "maxCacheSize": 200,
  "requestTimeout": 30000,
  "dbPath": "/Users/vexx/Repos/mcp-docsrs/.cache"
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
./mcp-docsrs --cache-ttl 7200000 --max-cache-size 200

# Use persistent database to cache documentation between sessions
./mcp-docsrs --db-path ~/.mcp-docsrs

# Or with environment variable
DB_PATH=~/.mcp-docsrs npm start
```

### 🔌 MCP Configuration

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "rust-docs": {
      "command": "node",
      "args": ["/path/to/mcp-docsrs/dist/index.js"]
    }
  }
}
```

Or using the executable:

```json
{
  "mcpServers": {
    "rust-docs": {
      "command": "/path/to/mcp-docsrs"
    }
  }
}
```

Or using Docker:

```json
{
  "mcpServers": {
    "rust-docs": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/vexxvakan/mcp-docsrs:latest"]
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

# Build with bytecode compilation (standalone, requires Bun runtime)
bun run build:bytecode

# Build for all platforms (7 targets, all with bytecode for fast startup)
bun run build:all

# Linux builds (GLIBC - standard)
bun run build:linux-x64      # Linux x64/AMD64
bun run build:linux-arm64    # Linux ARM64

# Linux builds (MUSL - for Alpine/containers)
bun run build:linux-x64-musl    # Linux x64/AMD64 (Alpine)
bun run build:linux-arm64-musl  # Linux ARM64 (Alpine)

# macOS builds
bun run build:darwin-x64     # macOS Intel
bun run build:darwin-arm64   # macOS Apple Silicon

# Windows build
bun run build:windows-x64    # Windows x64
```

### Build Output

All executables are created in the `dist/` directory with bytecode compilation for fast startup:

| File | Platform | Type | Size |
|------|----------|------|------|
| `mcp-docsrs-linux-x64` | Linux x64/AMD64 | GLIBC + Bytecode | ~99MB |
| `mcp-docsrs-linux-arm64` | Linux ARM64 | GLIBC + Bytecode | ~93MB |
| `mcp-docsrs-linux-x64-musl` | Linux x64/AMD64 | MUSL (static) + Bytecode | ~92MB |
| `mcp-docsrs-linux-arm64-musl` | Linux ARM64 | MUSL (static) + Bytecode | ~88MB |
| `mcp-docsrs-darwin-x64` | macOS Intel | Bytecode | ~64MB |
| `mcp-docsrs-darwin-arm64` | macOS Apple Silicon | Bytecode | ~58MB |
| `mcp-docsrs-windows-x64.exe` | Windows x64 | Bytecode | ~113MB |

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

# Check build sizes (updates README table)
bun run check:sizes  # Run after building
```

### Testing

The project includes comprehensive tests for all major components:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test cache.test.ts

# Run tests with full error logging (including expected errors)
LOG_EXPECTED_ERRORS=true bun test
```

#### Test Output

Tests are configured to provide clean output by default:

- ✅ Expected errors (like `CrateNotFoundError` in 404 tests) show as green checkmarks: `✓ Expected CrateNotFoundError thrown`
- ❌ Unexpected errors are shown with full stack traces in red
- ℹ️ Info logs are shown to track test execution

This makes it easy to distinguish between:

- Tests that verify error handling (expected errors)
- Actual test failures (unexpected errors)

To see full error details for debugging, set `LOG_EXPECTED_ERRORS=true`.

### Project Structure

```text
mcp-docsrs/
├── src/                        # Source code
│   ├── cli.ts                  # CLI entry point with argument parsing
│   ├── index.ts                # MCP server entry point
│   ├── server.ts               # MCP server implementation with tool/resource handlers
│   ├── cache.ts                # LRU cache with SQLite persistence
│   ├── docs-fetcher.ts         # HTTP client for docs.rs JSON API
│   ├── rustdoc-parser.ts       # Parser for rustdoc JSON format
│   ├── errors.ts               # Custom error types and error handling
│   ├── types.ts                # TypeScript types and Zod schemas
│   └── tools/                  # MCP tool implementations
│       ├── index.ts            # Tool exports and registration
│       ├── lookup-crate.ts     # Fetch complete crate documentation
│       ├── lookup-item.ts      # Fetch specific item documentation
│       └── search-crates.ts    # Search crates on crates.io
├── test/                       # Test files
│   ├── cache.test.ts           # Cache functionality tests
│   ├── cache-status.test.ts    # Cache status and metrics tests
│   ├── docs-fetcher.test.ts    # API client tests
│   ├── integration.test.ts     # End-to-end integration tests
│   ├── persistent-cache.test.ts # SQLite cache persistence tests
│   ├── rustdoc-parser.test.ts  # JSON parser tests
│   └── search-crates.test.ts   # Crate search tests
├── scripts/                    # Development and testing scripts
│   ├── test-crates-search.ts   # Manual crate search testing
│   ├── test-mcp.ts             # MCP server testing
│   ├── test-persistent-cache.ts # Cache persistence testing
│   ├── test-resources.ts       # Resource endpoint testing
│   └── test-zstd.ts            # Zstandard compression testing
├── plans/                      # Project planning documents
│   └── feature-recommendations.md # Future feature ideas
├── dist/                       # Build output (platform executables)
├── .github/                    # GitHub Actions workflows
│   ├── workflows/              # CI/CD pipeline definitions
│   └── ...                     # Various automation configs
├── CLAUDE.md                   # AI assistant instructions
├── README.md                   # Project documentation
├── LICENSE                     # Apache 2.0 license
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── biome.json                  # Code formatter/linter config
└── bun.lock                    # Bun package lock file
```

<a id="notes"></a>

## 📝 Notes
<a id="notes"></a>

- 📅 The rustdoc JSON feature on docs.rs started on **2025-05-23**, so releases before that date won't have JSON available
- 🔄 The server automatically handles redirects and format version compatibility
- ⚡ Cached responses significantly improve performance for repeated lookups
- 📦 Built executables include all dependencies - no runtime installation required
- ⚠️ **MUSL builds limitation**: Due to a [known Bun issue](https://github.com/oven-sh/bun/issues/16056), MUSL builds are not fully static and require `libstdc++` to run. For Docker/Alpine deployments, install `libstdc++` with: `apk add libstdc++`

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
