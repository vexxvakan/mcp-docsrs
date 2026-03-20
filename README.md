# MCP Rust Docs Server

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-yellow.svg?style=for-the-badge?logo=apache)](https://opensource.org/licenses/Apache-2.0)

>A **Model Context Protocol** (MCP) server for **fetching Rust crate documentation** from [docs.rs](https://docs.rs) using the **rustdoc JSON API**

[Features](#features) • [Installation](#installation) • [Building](#building) • [Development](#development) • [Acknowledgments](#acknowledgments) • [License](#license)

## Features
<a id="features"></a>

- **Documentation Fetching** - Direct access to rustdoc JSON API for comprehensive crate documentation
- **Symbol-Level Lookup** - Query specific structs, functions, traits, and more within crates

## Installation
<a id="installation"></a>

### Using Bun

```bash
bun install
bun run build:bytecode
./dist/mcp-docsrs
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
- **Apple Silicon**: `mcp-docsrs-darwin-arm64` - For M-series Macs

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

### 🛠️ Available Tools

#### `lookup_crate`

Fetches comprehensive documentation for an entire Rust crate.

**Parameters:**

| Parameter | Type | Required | Description |
| ----------- | ------ | ---------- | ------------- |
| `crateName` | string | ✅ | Name of the Rust crate |
| `version` | string | ❌ | Specific version or semver range (e.g., "1.0.0", "~4") |
| `target` | string | ❌ | Target platform (e.g., "i686-pc-windows-msvc") |
| `formatVersion` | string | ❌ | Rustdoc JSON format version |

**Example:**

```json
{
  "tool": "lookup_crate",
  "arguments": {
    "crateName": "serde",
    "version": "latest"
  }
}
```

#### `lookup_symbol`

Fetches documentation for a specific item within a crate.

**Parameters:**

| Parameter | Type | Required | Description |
| ----------- | ------ | ---------- | ------------- |
| `crateName` | string | ✅ | Name of the Rust crate |
| `itemPath` | string | ✅ | Path to the item (e.g., "struct.MyStruct", "fn.my_function") |
| `version` | string | ❌ | Specific version or semver range |
| `target` | string | ❌ | Target platform |

**Example:**

```json
{
  "tool": "lookup_symbol",
  "arguments": {
    "crateName": "tokio",
    "symbolPath": "runtime.Runtime"
  }
}
```

#### `search_crates`

Search for Rust crates on crates.io with fuzzy/partial name matching.

**Parameters:**

| Parameter | Type | Required | Description |
| ----------- | ------ | ---------- | ------------- |
| `query` | string | ✅ | Search query for crate names (supports partial matches) |
| `limit` | number | ❌ | Maximum number of results to return (default: 10) |

**Example:**

```json
{
  "tool": "search_crates",
  "arguments": {
    "query": "serde",
    "limit": 5
  }
}
```

### Configuration

Configure the server using environment variables or command-line arguments:

| Variable | CLI Flag | Default | Description |
| ---------- | ---------- | --------- | ------------- |
| `CACHE_TTL` | `--cache-ttl` | 3600000 | Cache time-to-live in milliseconds |
| `MAX_CACHE_SIZE` | `--max-cache-size` | 100 | Maximum number of cached entries |
| `REQUEST_TIMEOUT` | `--request-timeout` | 30000 | HTTP request timeout in milliseconds |
| `DB_PATH` | `--db-path` | :memory: | Path to SQLite database file (use `:memory:` for in-memory) |

### MCP Configuration

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "docsrs": {
      "command": "/path/to/mcp-docsrs"
    }
  }
}
```

Or using Docker:

```json
{
  "mcpServers": {
    "docsrs": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/vexxvakan/mcp-docsrs:latest"]
    }
  }
}
```

## Building
<a id="building"></a>

### Prerequisites

- Bun v1.3.11 or later

### Build Commands

```bash
# Build for current platform
bun run build

# Build with bytecode compilation (standalone, requires Bun runtime)
bun run build:bytecode

# Build for all platforms
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

## Development
<a id="development"></a>

### Development Workflow

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun run test

# Lint code
bun run lint

# Type checking
bun run check
```

### Testing

The project includes comprehensive tests for all major components:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/server/tests/server.test.ts

```

#### Test Output

Tests are configured to provide clean output by default:

- Expected errors (like `CrateNotFoundError` in 404 tests) show as green checkmarks: `✓ Expected CrateNotFoundError thrown`
- Unexpected errors are shown with full stack traces in red
- Info logs are shown to track test execution

## Acknowledgments
<a id="acknowledgments"></a>

- [docs.rs](https://docs.rs) for providing the Rust documentation API
- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP specification
- The Rust community for excellent documentation standards

## License
<a id="license"></a>

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Rust community

[Report Bug](https://github.com/vexxvakan/mcp-docsrs/issues) • [Request Feature](https://github.com/vexxvakan/mcp-docsrs/issues)
