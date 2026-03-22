# Docs.rs MCP Server

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-yellow.svg?style=for-the-badge?logo=apache)](https://opensource.org/licenses/Apache-2.0)

>A **Model Context Protocol** (MCP) server for **fetching Rust crate documentation** from [docs.rs](https://docs.rs)

[Features](#features) • [Getting Started](#getting-started) • [Tools](#tools) • [Contributing](#contributing) • [Acknowledgments](#acknowledgments) • [License](#license)

## Features
<a id="features"></a>

- **Find New Crates** - Search crates by exact name, partial match, or fuzzy query to discover relevant libraries
- **Inspect Crate Symbols** - Inspect structs, traits, functions, and any other symbol inside a crate
- **Review Crate Summaries** - Get a crate overview with its structure and public API surface
- **Read Full Documentation** - Read crate-level documentation

## Getting Started
<a id="getting-started"></a>

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

### MCP Setup

| Client | Command |
| ---------- | ---------- |
| Codex | `codex mcp add docsrs -- path/to/mcp-docsrs` |
| Claude Code | `claude mcp add --transport stdio docsrs -- path/to/mcp-docsrs` |
| Gemini CLI | `gemini mcp add -s user docsrs path/to/mcp-docsrs` |
| OpenCode | Run `opencode mcp add`, choose a local MCP server, then point it at `path/to/mcp-docsrs`. |
| VS Code | Open Command Palette (`Cmd/Ctrl+Shift+P`) → `MCP: Add Server` → choose `Workspace` or `User` → `Command (stdio)` → enter `path/to/mcp-docsrs`. |
| Cursor | Open Settings (`Cmd/Ctrl+Shift+J`) → `Tools & Integrations` → `New MCP Server` → choose a local/stdio server → enter `path/to/mcp-docsrs`. |

After adding the server, restart the client if it does not discover the tools immediately.

### Configuration

Configure the server using environment variables or command-line arguments:

| Variable | CLI Flag | Default | Description |
| ---------- | ---------- | --------- | ------------- |
| `CACHE_TTL` | `--cache-ttl` | 3600000 | Cache time-to-live in milliseconds |
| `MAX_CACHE_SIZE` | `--max-cache-size` | 100 | Maximum number of cached entries |
| `REQUEST_TIMEOUT` | `--request-timeout` | 30000 | HTTP request timeout in milliseconds |
| `DB_PATH` | `--db-path` | :memory: | Path to SQLite database file |

## Tools
<a id="tools"></a>

The server exposes four MCP tools:

### Crate

#### `crate_lookup`

Retrieves a crate overview with its structure and public API surface from docs.rs.

| Parameter | Type | Required | Description |
| ---------- | ---------- | ---------- | ---------- |
| `crateName` | string | Yes | Name of the Rust crate to inspect |
| `version` | string | No | Specific version or semver range, for example `"1.0.0"` or `"~4"` |
| `target` | string | No | Target platform, for example `"i686-pc-windows-msvc"` |
| `formatVersion` | number | No | Rustdoc JSON format version |

```json
{
  "tool": "crate_lookup",
  "arguments": {
    "crateName": "tokio",
    "version": "1.48.0"
  }
}
```

#### `crate_docs`

Retrieves the crate-level documentation page from docs.rs.

| Parameter | Type | Required | Description |
| ---------- | ---------- | ---------- | ---------- |
| `crateName` | string | Yes | Name of the Rust crate to inspect |
| `version` | string | No | Specific version or semver range, for example `"1.0.0"` or `"~4"` |
| `target` | string | No | Target platform, for example `"i686-pc-windows-msvc"` |
| `formatVersion` | number | No | Rustdoc JSON format version |

```json
{
  "tool": "crate_docs",
  "arguments": {
    "crateName": "serde"
  }
}
```

#### `crate_find`

Searches crates.io for matching crates and returns ranked results using fuzzy and partial name matching.

| Parameter | Type | Required | Description |
| ---------- | ---------- | ---------- | ---------- |
| `query` | string | Yes | Search query for crate names |
| `limit` | number | No | Maximum number of results to return. Defaults to `10` |

```json
{
  "tool": "crate_find",
  "arguments": {
    "query": "rustdoc json",
    "limit": 5
  }
}
```

### Symbol

#### `lookup_symbol`

Retrieves structured symbol metadata for one symbol inside a crate.

| Parameter | Type | Required | Description |
| ---------- | ---------- | ---------- | ---------- |
| `crateName` | string | Yes | Name of the Rust crate |
| `symbolType` | string | Yes | Rustdoc symbol type, for example `"struct"`, `"function"`, or `"trait"` |
| `symbolname` | string | Yes | Symbol name or path, for example `"runtime::Runtime"` or `"spawn"` |
| `version` | string | No | Specific version or semver range |
| `target` | string | No | Target platform |

```json
{
  "tool": "lookup_symbol",
  "arguments": {
    "crateName": "tokio",
    "symbolType": "struct",
    "symbolname": "runtime::Runtime"
  }
}
```

#### `symbol_docs`

Retrieves the full documentation body for one symbol inside a crate.

| Parameter | Type | Required | Description |
| ---------- | ---------- | ---------- | ---------- |
| `crateName` | string | Yes | Name of the Rust crate |
| `symbolType` | string | Yes | Rustdoc symbol type, for example `"struct"`, `"function"`, or `"trait"` |
| `symbolname` | string | Yes | Symbol name or path, for example `"runtime::Runtime"` or `"spawn"` |
| `version` | string | No | Specific version or semver range |
| `target` | string | No | Target platform |

```json
{
  "tool": "symbol_docs",
  "arguments": {
    "crateName": "tokio",
    "symbolType": "struct",
    "symbolname": "runtime::Runtime"
  }
}
```

## Contributing
<a id="contributing"></a>

- See [CONTRIBUTING.md](CONTRIBUTING.md).
- See [TESTING.md](TESTING.md).

## Acknowledgments
<a id="acknowledgments"></a>

- [docs.rs](https://docs.rs) for providing the Rust documentation API
- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP specification
- The Rust community for excellent documentation standards

## License
<a id="license"></a>

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for the license text and [NOTICE](NOTICE) for attribution details.

---

Made with ❤️ for the Rust community

[Report Bug](https://github.com/vexxvakan/mcp-docsrs/issues) • [Request Feature](https://github.com/vexxvakan/mcp-docsrs/issues)
