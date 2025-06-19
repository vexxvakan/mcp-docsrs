# Integration Tests

This directory contains integration tests for the mcp-docsrs binary executables across different platforms.

## Structure

- `test-binary.ts` - Main integration test suite orchestrator
- `test-musl.sh` - Basic test script for MUSL builds (runs inside Alpine container)
- `test-crates-search.ts` - Tests for crate search functionality
- `test-mcp-protocol.ts` - Tests for MCP protocol implementation
- `test-persistent-cache.ts` - Tests for persistent cache functionality
- `test-resources.ts` - Tests for MCP resources and cache management
- `test-zstd.ts` - Tests for zstd decompression functionality
- `README.md` - This file

## Running Tests

### Native Binaries

```bash
bun test/integration/test-binary.ts ./dist/mcp-docsrs-linux-x64 linux-x64
```

### MUSL Binaries (in Docker)

```bash
docker run --rm -v $PWD:/workspace alpine:latest sh -c "
  apk add --no-cache libstdc++ libgcc && 
  /workspace/test/integration/test-musl.sh /workspace/dist/mcp-docsrs-linux-x64-musl linux-x64-musl
"
```

## Test Coverage

The integration tests verify:

### Basic Tests (All Platforms)
1. **Version Flag** - Binary responds correctly to `--version`
2. **Server Startup** - MCP server starts and shuts down cleanly
3. **Cache Functionality** - Cache directory is properly handled
4. **MCP Operations** - Basic MCP protocol operations work correctly

### Extended Tests (Non-MUSL Platforms)
5. **Crate Search** - Search functionality with various query types
6. **MCP Protocol** - Full protocol implementation including error handling
7. **Persistent Cache** - Cache persistence across server restarts
8. **Resources** - MCP resources, cache statistics, SQL queries, and security
9. **Zstd Decompression** - Decompression of compressed documentation from docs.rs

## Platform-Specific Tests

- **Linux (GLIBC)** - Direct execution tests
- **Linux (MUSL)** - Containerized Alpine Linux tests
- **macOS** - Direct execution tests on Intel and Apple Silicon
- **Windows** - Direct execution tests with Windows-specific handling