import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { createDocsFetcher } from "./docs-fetcher.js"
import {
	ErrorLogger,
	ItemNotFoundError,
	isCrateNotFoundError,
	isJSONParseError,
	isMCPDocsRsError
} from "./errors.js"
import { findItem, parseCrateInfo } from "./rustdoc-parser.js"
import type { DocsResponse, LookupCrateArgs, LookupItemArgs, ServerConfig } from "./types.js"

// Create MCP server handlers
const createHandlers = (config: ServerConfig = {}) => {
	const fetcher = createDocsFetcher(config)

	// Handler for lookup_crate_docs
	const handleLookupCrate = async (args: LookupCrateArgs): Promise<DocsResponse> => {
		try {
			const { data: json, fromCache } = await fetcher.fetchCrateJson(
				args.crateName,
				args.version,
				args.target,
				args.formatVersion
			)

			// Log cache status internally for debugging
			ErrorLogger.logInfo("Crate documentation retrieved", {
				crateName: args.crateName,
				fromCache
			})

			const content = parseCrateInfo(json)

			return {
				content: [
					{
						type: "text",
						text: content
					}
				]
			}
		} catch (error) {
			// Log the error with full context
			if (error instanceof Error) {
				ErrorLogger.log(error)
			}

			// Provide user-friendly error messages based on error type
			let errorMessage: string
			if (isJSONParseError(error)) {
				errorMessage =
					"Failed to parse JSON from docs.rs. The response may not be valid rustdoc JSON."
			} else if (isCrateNotFoundError(error)) {
				errorMessage = error.message
			} else if (isMCPDocsRsError(error)) {
				errorMessage = error.message
			} else if (error instanceof Error) {
				errorMessage = error.message
			} else {
				errorMessage = "Unknown error occurred"
			}

			return {
				content: [
					{
						type: "text",
						text: `Error: ${errorMessage}`
					}
				],
				isError: true
			}
		}
	}

	// Handler for lookup_item_docs
	const handleLookupItem = async (args: LookupItemArgs): Promise<DocsResponse> => {
		try {
			const { data: json, fromCache } = await fetcher.fetchCrateJson(
				args.crateName,
				args.version,
				args.target
			)

			// Log cache status internally for debugging
			ErrorLogger.logInfo("Item documentation retrieved", {
				crateName: args.crateName,
				itemPath: args.itemPath,
				fromCache
			})

			const itemContent = findItem(json, args.itemPath)

			if (!itemContent) {
				throw new ItemNotFoundError(args.crateName, args.itemPath)
			}

			return {
				content: [
					{
						type: "text",
						text: itemContent
					}
				]
			}
		} catch (error) {
			// Log the error with full context
			if (error instanceof Error) {
				ErrorLogger.log(error)
			}

			// Provide user-friendly error messages based on error type
			let errorMessage: string
			if (isJSONParseError(error)) {
				errorMessage =
					"Failed to parse JSON from docs.rs. The response may not be valid rustdoc JSON."
			} else if (isCrateNotFoundError(error)) {
				errorMessage = error.message
			} else if (isMCPDocsRsError(error)) {
				errorMessage = error.message
			} else if (error instanceof Error) {
				errorMessage = error.message
			} else {
				errorMessage = "Unknown error occurred"
			}

			return {
				content: [
					{
						type: "text",
						text: `Error: ${errorMessage}`
					}
				],
				isError: true
			}
		}
	}

	// Cache query functions
	const getCacheStats = () => {
		return fetcher.getCacheStats()
	}

	const getCacheEntries = (limit: number, offset: number) => {
		return fetcher.getCacheEntries(limit, offset)
	}

	const queryCacheDb = (sql: string) => {
		return fetcher.queryCacheDb(sql)
	}

	// Get server configuration
	const getServerConfig = () => {
		return {
			cacheTtl: config.cacheTtl || 3600000,
			maxCacheSize: config.maxCacheSize || 100,
			requestTimeout: config.requestTimeout || 30000,
			dbPath: config.dbPath || ":memory:"
		}
	}

	// Cleanup function
	const cleanup = () => {
		fetcher.close()
	}

	return {
		handleLookupCrate,
		handleLookupItem,
		cleanup,
		getCacheStats,
		getCacheEntries,
		queryCacheDb,
		getServerConfig
	}
}

// Create and configure the MCP server
export const createRustDocsServer = (config: ServerConfig = {}) => {
	const server = new McpServer({
		name: "mcp-docsrs",
		version: "1.0.0"
	})

	const handlers = createHandlers(config)

	const crateAnnotations = {
		title: "Lookup Rust Crate Documentation",
		readOnlyHint: true,
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true
	}

	const itemAnnotations = {
		title: "Lookup Rust Item Documentation",
		readOnlyHint: true,
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true
	}

	// Define input schemas inline to avoid type compatibility issues
	const crateInputSchema = {
		crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
		version: z
			.string()
			.optional()
			.describe('Specific version (e.g., "1.0.0") or semver range (e.g., "~4")'),
		target: z.string().optional().describe('Target platform (e.g., "i686-pc-windows-msvc")'),
		formatVersion: z.number().optional().describe("Rustdoc JSON format version")
	}

	const itemInputSchema = {
		crateName: z.string().describe("Name of the Rust crate"),
		itemPath: z
			.string()
			.describe('Path to specific item (e.g., "struct.MyStruct" or "fn.my_function")'),
		version: z.string().optional().describe("Specific version or semver range"),
		target: z.string().optional().describe("Target platform")
	}

	server.registerTool(
		"lookup_crate_docs",
		{
			annotations: crateAnnotations,
			description: "Lookup documentation for a Rust crate from docs.rs",
			inputSchema: crateInputSchema as any
		},
		handlers.handleLookupCrate as any
	)

	server.registerTool(
		"lookup_item_docs",
		{
			annotations: itemAnnotations,
			description:
				"Lookup documentation for a specific item (struct, function, etc.) in a Rust crate",
			inputSchema: itemInputSchema as any
		},
		handlers.handleLookupItem as any
	)

	// Setup prompts - Using simple overload without schema to avoid type issues
	server.prompt(
		"lookup_crate_docs",
		"Analyze and summarize documentation for a Rust crate",
		(_extra) => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: `Please analyze and summarize the documentation for the Rust crate. Focus on:
1. The main purpose and features of the crate
2. Key types and functions
3. Common usage patterns
4. Any important notes or warnings

Documentation content will follow.`
					}
				}
			]
		})
	)

	server.prompt(
		"lookup_item_docs",
		"Provide detailed information about a specific item from a Rust crate",
		(_extra) => ({
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: `Please provide detailed information about a specific item from a Rust crate. Include:
1. Purpose and functionality
2. Parameters/fields and their types
3. Usage examples if available
4. Related items

Documentation content will follow.`
					}
				}
			]
		})
	)

	// Register cache query resources
	server.resource(
		"cache-stats",
		new ResourceTemplate("cache://stats", {
			list: async () => ({
				resources: [
					{
						name: "Cache Statistics",
						uri: "cache://stats",
						description: "Get cache statistics including total entries and size"
					}
				]
			})
		}),
		(uri) => {
			try {
				const stats = handlers.getCacheStats()
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(stats, null, 2)
						}
					]
				}
			} catch (error) {
				ErrorLogger.log(error as Error)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/plain",
							text: `Error retrieving cache statistics: ${(error as Error).message}`
						}
					]
				}
			}
		}
	)

	server.resource(
		"cache-entries",
		new ResourceTemplate("cache://entries?limit={limit}&offset={offset}", {
			list: async () => ({
				resources: [
					{
						name: "Cache Entries",
						uri: "cache://entries?limit=10&offset=0",
						description: "List cached documentation entries"
					}
				]
			})
		}),
		(uri, args) => {
			try {
				const limit = args.limit ? Number.parseInt(args.limit as string) : 100
				const offset = args.offset ? Number.parseInt(args.offset as string) : 0
				const entries = handlers.getCacheEntries(limit, offset)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(entries, null, 2)
						}
					]
				}
			} catch (error) {
				ErrorLogger.log(error as Error)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/plain",
							text: `Error retrieving cache entries: ${(error as Error).message}`
						}
					]
				}
			}
		}
	)

	server.resource(
		"cache-query",
		new ResourceTemplate("cache://query?sql={sql}", {
			list: async () => ({
				resources: [
					{
						name: "Cache Query",
						uri: "cache://query?sql=SELECT key FROM cache LIMIT 10",
						description:
							"Execute SELECT queries on the cache database. Example: SELECT key, LENGTH(data) as size FROM cache WHERE key LIKE '%serde%'"
					}
				]
			})
		}),
		(uri, args) => {
			try {
				// Only allow SELECT queries for safety
				const sql = decodeURIComponent(args.sql as string)
				if (!sql || !sql.trim().toUpperCase().startsWith("SELECT")) {
					throw new Error("Only SELECT queries are allowed for safety")
				}
				const results = handlers.queryCacheDb(sql)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(results, null, 2)
						}
					]
				}
			} catch (error) {
				ErrorLogger.log(error as Error)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/plain",
							text: `Error executing query: ${(error as Error).message}`
						}
					]
				}
			}
		}
	)

	server.resource(
		"server-config",
		new ResourceTemplate("cache://config", {
			list: async () => ({
				resources: [
					{
						name: "Server Configuration",
						uri: "cache://config",
						description:
							"Get current server configuration (cache TTL, max size, DB path, etc.)"
					}
				]
			})
		}),
		(uri) => {
			try {
				const config = handlers.getServerConfig()
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "application/json",
							text: JSON.stringify(config, null, 2)
						}
					]
				}
			} catch (error) {
				ErrorLogger.log(error as Error)
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: "text/plain",
							text: `Error retrieving server configuration: ${(error as Error).message}`
						}
					]
				}
			}
		}
	)

	// Start the server
	const start = async (): Promise<void> => {
		try {
			const transport = new StdioServerTransport()
			await server.connect(transport)
			ErrorLogger.logInfo("MCP Rust Docs Server is running", { config })
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw error
		}
	}

	// Cleanup on exit
	const cleanup = () => {
		handlers.cleanup()
	}

	// Setup error handlers
	process.on("SIGINT", () => {
		cleanup()
		process.exit(0)
	})

	process.on("SIGTERM", () => {
		cleanup()
		process.exit(0)
	})

	process.on("uncaughtException", (error) => {
		ErrorLogger.log(error as Error)
		cleanup()
		process.exit(1)
	})

	return {
		start,
		cleanup,
		server
	}
}
