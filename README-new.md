# mcp-docsrs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/modelcontextprotocol)

An MCP (Model Context Protocol) server for accessing Rust crate documentation via the docs.rs JSON API. This server provides intelligent documentation fetching with built-in caching, zstd decompression support, and comprehensive error handling.

## 🚀 Features

- **Documentation Access**: Fetch complete crate documentation and specific item docs from docs.rs
- **Intelligent Caching**: SQLite-based LRU cache with configurable TTL and size limits
- **Compression Support**: Automatic zstd decompression for compressed documentation
- **Flexible Queries**: Support for specific versions, targets, and rustdoc format versions
- **Search Integration**: Search for crates with fuzzy matching and similarity suggestions
- **Resource Inspection**: Built-in cache statistics and SQL query interface
- **Cross-Platform**: Pre-built binaries for Linux (x64/ARM64), macOS (x64/ARM64), and Windows

## 🛠️ Installation

### Option 1: Download Pre-built Binaries

Download the appropriate binary for your platform from the [releases page](https://github.com/zuedev/mcp-docsrs/releases):

- **Linux x64**: `mcp-docsrs-linux-x64`
- **Linux ARM64**: `mcp-docsrs-linux-arm64`
- **macOS x64**: `mcp-docsrs-darwin-x64`
- **macOS ARM64**: `mcp-docsrs-darwin-arm64`
- **Windows x64**: `mcp-docsrs-win-x64.exe`

Make the binary executable (Unix systems):
```bash
chmod +x mcp-docsrs-*
```

### Option 2: Build from Source

Requires [Bun](https://bun.sh) installed on your system.

```bash
# Clone the repository
git clone https://github.com/zuedev/mcp-docsrs.git
cd mcp-docsrs

# Install dependencies
bun install

# Build for your platform
bun run build

# Or build for all platforms
bun run build:all
```

## 📋 MCP Configuration

Add to your MCP client configuration:

### Claude Desktop

Update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-docsrs": {
      "command": "/path/to/mcp-docsrs",
      "env": {
        "CACHE_TTL": "3600000",
        "MAX_CACHE_SIZE": "100",
        "DB_PATH": "/path/to/cache"
      }
    }
  }
}
```

### Cline/Other MCP Clients

```json
{
  "mcp-docsrs": {
    "command": "/path/to/mcp-docsrs",
    "args": [],
    "env": {
      "CACHE_TTL": "3600000",
      "MAX_CACHE_SIZE": "100", 
      "DB_PATH": "/path/to/cache"
    }
  }
}
```

## ⚙️ Configuration

The server supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CACHE_TTL` | Cache time-to-live in milliseconds | `3600000` (1 hour) |
| `MAX_CACHE_SIZE` | Maximum number of cached items | `100` |
| `DB_PATH` | Path to cache database directory | `~/.mcp-docsrs` |
| `REQUEST_TIMEOUT` | HTTP request timeout in milliseconds | `30000` (30 seconds) |
| `USER_AGENT` | User agent for API requests | `mcp-docsrs/1.0` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |

## 🔧 Tools

### `lookup_crate_docs`

Fetches documentation for a Rust crate.

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
    "crateName": "tinc",
    "version": "0.1.6"
  }
}
```

#### `lookup_item_docs`

Fetches documentation for a specific item within a crate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|------|-------------|
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
    "key": "tinc/0.1.6/x86_64-unknown-linux-gnu",
    "timestamp": "2024-01-15T14:20:00.000Z",
    "ttl": 3600000,
    "expiresAt": "2024-01-15T15:20:00.000Z",
    "size": 524288
  }
]
```

#### `cache://query?sql={query}`

Execute SQL queries on the cache database (SELECT only for security).

**Example:**

```
cache://query?sql=SELECT COUNT(*) FROM cache_entries WHERE key LIKE '%tokio%'
```

## 🏗️ Architecture

The server is built with:

- **TypeScript** - Type-safe implementation
- **Bun** - Fast JavaScript runtime and bundler
- **SQLite** - Persistent cache storage with better-sqlite3
- **fzstd** - Zstandard decompression for compressed docs
- **MCP SDK** - Official Model Context Protocol implementation

### Key Components

- `server.ts` - MCP server implementation
- `tools/` - Tool implementations for crate and item lookups
- `cache.ts` - LRU cache with SQLite persistence
- `docs-fetcher.ts` - HTTP client for docs.rs API
- `rustdoc-parser.ts` - Parser for rustdoc JSON format

## 🧪 Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run with debug logging
DEBUG=mcp:* bun run src/cli.ts

# Build standalone executable
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run lint:fix
```

## 📊 Build Output

The project supports building for multiple platforms:

| Platform | Binary Size | Architecture | Notes |
|----------|------------|--------------|-------|
| Linux x64 | ~95MB | x86_64 | Standard Linux |
| Linux ARM64 | ~95MB | aarch64 | ARM processors |
| macOS x64 | ~95MB | x86_64 | Intel Macs |
| macOS ARM64 | ~95MB | aarch64 | Apple Silicon |
| Windows x64 | ~75MB | x86_64 | 64-bit Windows |

All binaries include the Bun runtime for zero-dependency deployment.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [docs.rs](https://docs.rs) for providing the Rust documentation API
- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP specification
- The Rust community for excellent documentation standards