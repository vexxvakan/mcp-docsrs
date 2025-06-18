import { z } from "zod"
import {
	ErrorLogger,
	ItemNotFoundError,
	isCrateNotFoundError,
	isJSONParseError,
	isMCPDocsRsError
} from "../errors.js"
import { findItem } from "../rustdoc-parser.js"
import type { DocsFetcher, DocsResponse, LookupItemArgs } from "../types.js"

// Input schema for lookup_item_docs tool
export const lookupItemInputSchema = {
	crateName: z.string().describe("Name of the Rust crate"),
	itemPath: z
		.string()
		.describe('Path to specific item (e.g., "struct.MyStruct" or "fn.my_function")'),
	version: z.string().optional().describe("Specific version or semver range"),
	target: z.string().optional().describe("Target platform")
}

// Tool metadata
export const lookupItemTool = {
	name: "lookup_item_docs",
	description: "Lookup documentation for a specific item (struct, function, etc.) in a Rust crate",
	annotations: {
		title: "Lookup Rust Item Documentation",
		readOnlyHint: true,
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true
	}
}

// Handler for lookup_item_docs
export const createLookupItemHandler = (fetcher: DocsFetcher) => {
	return async (args: LookupItemArgs): Promise<DocsResponse> => {
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
}

// Prompt arguments schema for lookup_item_docs
export const lookupItemPromptSchema = {
	crateName: z.string().optional().describe("Name of the Rust crate"),
	itemPath: z
		.string()
		.optional()
		.describe('Path to specific item (e.g., "struct.MyStruct" or "fn.my_function")'),
	version: z.string().optional().describe("Specific version or semver range"),
	target: z.string().optional().describe("Target platform")
}

// Prompt for lookup_item_docs with dynamic argument handling
export const lookupItemPrompt = {
	name: "lookup_item_docs",
	description: "Provide detailed information about a specific item from a Rust crate",
	argsSchema: lookupItemPromptSchema,
	handler: (args: any) => {
		// Check if required arguments are missing
		if (!args?.crateName && !args?.itemPath) {
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: "I need to know which Rust crate and item you'd like documentation for. Please provide:\n1. The crate name (e.g., 'tokio', 'serde')\n2. The item path (e.g., 'struct.Runtime', 'fn.spawn')"
						}
					}
				]
			}
		}

		if (!args?.crateName) {
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: `Which Rust crate contains the item "${args.itemPath}"? Please provide the crate name.`
						}
					}
				]
			}
		}

		if (!args?.itemPath) {
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: `What specific item from the "${args.crateName}" crate would you like documentation for? Please provide the item path (e.g., 'struct.MyStruct', 'fn.my_function', 'trait.MyTrait').`
						}
					}
				]
			}
		}

		// Build the prompt text with the provided arguments
		let promptText = `Please provide detailed information about the "${args.itemPath}" from the Rust crate "${args.crateName}"`

		if (args.version) {
			promptText += ` version ${args.version}`
		}

		promptText += `. Include:
1. Purpose and functionality
2. Parameters/fields and their types
3. Usage examples if available
4. Related items

I'll fetch the documentation for you.`

		return {
			messages: [
				{
					role: "user" as const,
					content: {
						type: "text" as const,
						text: promptText
					}
				}
			]
		}
	}
}
