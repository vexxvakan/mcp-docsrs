import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
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
			const json = await fetcher.fetchCrateJson(
				args.crateName,
				args.version,
				args.target,
				args.formatVersion
			)

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
			const json = await fetcher.fetchCrateJson(args.crateName, args.version, args.target)

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

	// Cleanup function
	const cleanup = () => {
		fetcher.close()
	}

	return {
		handleLookupCrate,
		handleLookupItem,
		cleanup
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

	// 	// Setup prompts
	// 	server.prompt(
	// 		"lookup_crate_docs",
	// 		"Analyze and summarize documentation for a Rust crate",
	// 		{
	// 			crateName: z.string().describe("Name of the Rust crate")
	// 		},
	// 		({ crateName }: { crateName: string }) => ({
	// 			messages: [
	// 				{
	// 					role: "user",
	// 					content: {
	// 						type: "text",
	// 						text: `Please analyze and summarize the documentation for the Rust crate '${crateName}'. Focus on:
	// 1. The main purpose and features of the crate
	// 2. Key types and functions
	// 3. Common usage patterns
	// 4. Any important notes or warnings

	// Documentation content will follow.`
	// 					}
	// 				}
	// 			]
	// 		})
	// 	)

	// 	server.prompt(
	// 		"lookup_item_docs",
	// 		"Provide detailed information about a specific item from a Rust crate",
	// 		{
	// 			crateName: z.string().describe("Name of the Rust crate"),
	// 			itemPath: z.string().describe("Path to the item (e.g., 'struct.MyStruct')")
	// 		},
	// 		({ crateName, itemPath }: { crateName: string; itemPath: string }) => ({
	// 			messages: [
	// 				{
	// 					role: "user",
	// 					content: {
	// 						type: "text",
	// 						text: `Please provide detailed information about '${itemPath}' from the Rust crate '${crateName}'. Include:
	// 1. Purpose and functionality
	// 2. Parameters/fields and their types
	// 3. Usage examples if available
	// 4. Related items

	// Documentation content will follow.`
	// 					}
	// 				}
	// 			]
	// 		})
	// 	)

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
