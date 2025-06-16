#!/usr/bin/env bun

import { createRustDocsServer } from "./server.js"
import type { ServerConfig } from "./types.js"

// Configuration from environment variables
const config: ServerConfig = {
	cacheTtl: Number.parseInt(process.env.CACHE_TTL || "3600000"), // 1 hour default
	maxCacheSize: Number.parseInt(process.env.MAX_CACHE_SIZE || "100"),
	requestTimeout: Number.parseInt(process.env.REQUEST_TIMEOUT || "30000"), // 30s default
	dbPath: process.env.DB_PATH // undefined means in-memory database
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
