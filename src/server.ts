import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createDocsFetcher } from "./docs-fetcher.js"
import { ErrorLogger } from "./errors.js"
import {
	createLookupCrateHandler,
	createLookupItemHandler,
	createSearchCratesHandler,
	lookupCrateInputSchema,
	lookupCratePrompt,
	lookupCrateTool,
	lookupItemInputSchema,
	lookupItemPrompt,
	lookupItemTool,
	searchCratesInputSchema,
	searchCratesTool,
	suggestSimilarCrates
} from "./tools/index.js"
import type { ServerConfig } from "./types.js"

// Create MCP server handlers
const createHandlers = (config: ServerConfig = {}) => {
	const fetcher = createDocsFetcher(config)

	// Create tool handlers
	const lookupCrateHandler = createLookupCrateHandler(fetcher)
	const lookupItemHandler = createLookupItemHandler(fetcher)
	const searchCratesHandler = createSearchCratesHandler()

	// Enhanced lookup crate handler with suggestions
	const enhancedLookupCrateHandler = async (args: any) => {
		const result = await lookupCrateHandler(args)

		// If crate not found, suggest similar crates
		if (result.isError && result.content[0].text.includes("not found")) {
			const suggestions = await suggestSimilarCrates(args.crateName)
			// Only show suggestions if we found actual alternatives
			if (suggestions.length > 0 && !suggestions.includes(args.crateName)) {
				result.content[0].text += `\n\nDid you mean one of these crates?\n${suggestions.map((s) => `- ${s}`).join("\n")}`
			}
		}

		return result
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
		handleLookupCrate: enhancedLookupCrateHandler,
		handleLookupItem: lookupItemHandler,
		handleSearchCrates: searchCratesHandler,
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

	// Register tools
	server.registerTool(
		lookupCrateTool.name,
		{
			annotations: lookupCrateTool.annotations,
			description: lookupCrateTool.description,
			inputSchema: lookupCrateInputSchema as any
		},
		handlers.handleLookupCrate as any
	)

	server.registerTool(
		lookupItemTool.name,
		{
			annotations: lookupItemTool.annotations,
			description: lookupItemTool.description,
			inputSchema: lookupItemInputSchema as any
		},
		handlers.handleLookupItem as any
	)

	server.registerTool(
		searchCratesTool.name,
		{
			annotations: searchCratesTool.annotations,
			description: searchCratesTool.description,
			inputSchema: searchCratesInputSchema as any
		},
		handlers.handleSearchCrates as any
	)

	// Setup prompts
	server.prompt(lookupCratePrompt.name, lookupCratePrompt.description, lookupCratePrompt.handler)

	server.prompt(lookupItemPrompt.name, lookupItemPrompt.description, lookupItemPrompt.handler)

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
