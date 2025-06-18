import { z } from "zod"
import { ErrorLogger, isCrateNotFoundError, isJSONParseError, isMCPDocsRsError } from "../errors.js"
import { parseCrateInfo } from "../rustdoc-parser.js"
import type { DocsFetcher, DocsResponse, LookupCrateArgs } from "../types.js"

// Input schema for lookup_crate_docs tool
export const lookupCrateInputSchema = {
	crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
	version: z
		.string()
		.optional()
		.describe('Specific version (e.g., "1.0.0") or semver range (e.g., "~4")'),
	target: z.string().optional().describe('Target platform (e.g., "i686-pc-windows-msvc")'),
	formatVersion: z.number().optional().describe("Rustdoc JSON format version")
}

// Tool metadata
export const lookupCrateTool = {
	name: "lookup_crate_docs",
	description: "Lookup documentation for a Rust crate from docs.rs",
	annotations: {
		title: "Lookup Rust Crate Documentation",
		readOnlyHint: true,
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true
	}
}

// Handler for lookup_crate_docs
export const createLookupCrateHandler = (fetcher: DocsFetcher) => {
	return async (args: LookupCrateArgs): Promise<DocsResponse> => {
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
}

// Prompt arguments schema for lookup_crate_docs
export const lookupCratePromptSchema = {
	crateName: z.string().optional().describe("Name of the Rust crate to lookup documentation for"),
	version: z
		.string()
		.optional()
		.describe('Specific version (e.g., "1.0.0") or semver range (e.g., "~4")'),
	target: z.string().optional().describe('Target platform (e.g., "i686-pc-windows-msvc")')
}

// Prompt for lookup_crate_docs with dynamic argument handling
export const lookupCratePrompt = {
	name: "lookup_crate_docs",
	description: "Analyze and summarize documentation for a Rust crate",
	argsSchema: lookupCratePromptSchema,
	handler: (args: any) => {
		// Check if required arguments are missing
		if (!args?.crateName) {
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: "Which Rust crate would you like me to look up documentation for? Please provide the crate name."
						}
					}
				]
			}
		}

		// Build the prompt text with the provided arguments
		let promptText = `Please analyze and summarize the documentation for the Rust crate "${args.crateName}"`

		if (args.version) {
			promptText += ` version ${args.version}`
		}

		promptText += `. Focus on:
1. The main purpose and features of the crate
2. Key types and functions
3. Common usage patterns
4. Any important notes or warnings

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
