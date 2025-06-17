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

// Prompt for lookup_item_docs
export const lookupItemPrompt = {
	name: "lookup_item_docs",
	description: "Provide detailed information about a specific item from a Rust crate",
	handler: (_extra: any) => ({
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
}
