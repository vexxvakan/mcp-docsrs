#!/usr/bin/env bun

import { createRustDocsServer } from "./server.js"
import type { ServerConfig } from "./types.js"

// Parse command line arguments
const args = process.argv.slice(2)

// Show help if requested
if (args.includes("--help") || args.includes("-h")) {
	// Get the current binary path
	const currentBinaryPath = process.argv[1] || process.execPath

	console.log(`
MCP Rust Docs Server

A Model Context Protocol server for fetching Rust crate documentation from docs.rs

Usage:
  mcp-docsrs [options]

Options:
  -h, --help              Show this help message
  --version               Show version information
  --cache-ttl <ms>        Cache TTL in milliseconds (default: 3600000)
  --max-cache-size <n>    Maximum cache entries (default: 100)
  --request-timeout <ms>  Request timeout in milliseconds (default: 30000)
  --db-path <path>        Path to SQLite database file (default: :memory:)

Environment Variables:
  CACHE_TTL               Cache TTL in milliseconds
  MAX_CACHE_SIZE          Maximum cache entries
  REQUEST_TIMEOUT         Request timeout in milliseconds
  DB_PATH                 Path to SQLite database file

Examples:
  # Run with default settings
  mcp-docsrs

  # Run with custom cache settings
  mcp-docsrs --cache-ttl 7200000 --max-cache-size 200

  # Run with persistent database
  mcp-docsrs --db-path /path/to/cache.db

  # Run with environment variables
  CACHE_TTL=7200000 mcp-docsrs

MCP Integration:
  To use with Claude Desktop, add to your claude_desktop_config.json:
  {
    "mcpServers": {
      "rust-docs": {
        "command": "mcp-docsrs"
      }
    }
  }

  To use with Claude Code:
  claude mcp add mcp-docsrs ${currentBinaryPath}
`)
	process.exit(0)
}

// Show version if requested
if (args.includes("--version") || args.includes("-v")) {
	const packageJson = require("../package.json")
	console.log(`mcp-docsrs v${packageJson.version}`)
	process.exit(0)
}

// Parse command line options
const getArgValue = (argName: string): string | undefined => {
	const index = args.findIndex((arg) => arg === argName)
	if (index !== -1 && index + 1 < args.length) {
		return args[index + 1]
	}
	return undefined
}

// Configuration from command line and environment variables
const cacheTtl = Number.parseInt(getArgValue("--cache-ttl") || process.env.CACHE_TTL || "3600000") // 1 hour default
const maxCacheSize = Number.parseInt(
	getArgValue("--max-cache-size") || process.env.MAX_CACHE_SIZE || "100"
)
const requestTimeout = Number.parseInt(
	getArgValue("--request-timeout") || process.env.REQUEST_TIMEOUT || "30000"
) // 30s default
const dbPath = getArgValue("--db-path") || process.env.DB_PATH

// Validate configuration
if (Number.isNaN(cacheTtl) || cacheTtl <= 0) {
	console.error("Error: Invalid cache TTL value")
	process.exit(1)
}

if (Number.isNaN(maxCacheSize) || maxCacheSize <= 0) {
	console.error("Error: Invalid max cache size value")
	process.exit(1)
}

if (Number.isNaN(requestTimeout) || requestTimeout <= 0) {
	console.error("Error: Invalid request timeout value")
	process.exit(1)
}

// Create config object after validation
const config: ServerConfig = {
	cacheTtl,
	maxCacheSize,
	requestTimeout,
	dbPath
}

// Error handling
process.on("uncaughtException", (error) => {
	console.error("Uncaught exception:", error)
	process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled rejection at:", promise, "reason:", reason)
	process.exit(1)
})

// Create and start server
const { start, cleanup } = createRustDocsServer(config)

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.error("\nShutting down gracefully...")
	cleanup()
	process.exit(0)
})

process.on("SIGTERM", () => {
	console.error("\nShutting down gracefully...")
	cleanup()
	process.exit(0)
})

// Start the server
start().catch((error) => {
	console.error("Failed to start MCP server:", error)
	cleanup()
	process.exit(1)
})
