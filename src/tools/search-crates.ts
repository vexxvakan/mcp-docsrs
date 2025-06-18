import { z } from "zod"
import { ErrorLogger, NetworkError } from "../errors.js"
import type { DocsResponse } from "../types.js"

// Crates.io API types
interface CratesIoSearchResponse {
	crates: Array<{
		name: string
		description: string | null
		downloads: number
		recent_downloads: number
		max_version: string
		documentation: string | null
		repository: string | null
		homepage: string | null
	}>
	meta: {
		total: number
	}
}

// Input schema for search_crates tool
export const searchCratesInputSchema = {
	query: z.string().describe("Search query for crate names (supports partial matches)"),
	limit: z.number().optional().default(10).describe("Maximum number of results to return")
}

// Tool metadata
export const searchCratesTool = {
	name: "search_crates",
	description: "Search for Rust crates on crates.io with fuzzy/partial name matching",
	annotations: {
		title: "Search Rust Crates",
		readOnlyHint: true,
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: true
	}
}

// Handler for search_crates
export const createSearchCratesHandler = () => {
	return async (
		args: z.infer<z.ZodObject<typeof searchCratesInputSchema>>
	): Promise<DocsResponse> => {
		try {
			const searchUrl = `https://crates.io/api/v1/crates?q=${encodeURIComponent(args.query)}&per_page=${args.limit}`

			ErrorLogger.logInfo("Searching crates.io", {
				query: args.query,
				limit: args.limit
			})

			// Add timeout to prevent hanging requests
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

			const response = await fetch(searchUrl, {
				headers: {
					"User-Agent": "mcp-docsrs/1.0.0"
				},
				signal: controller.signal
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				throw new NetworkError(searchUrl, response.status, response.statusText)
			}

			const data = (await response.json()) as CratesIoSearchResponse

			if (data.crates.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No crates found matching "${args.query}"`
						}
					]
				}
			}

			// Format results
			const results = data.crates
				.map((crate, index) => {
					const parts = [
						`${index + 1}. **${crate.name}** v${crate.max_version}`,
						crate.description ? `   ${crate.description}` : "",
						`   Downloads: ${crate.downloads.toLocaleString()} (${crate.recent_downloads.toLocaleString()} recent)`,
						crate.documentation ? `   Docs: ${crate.documentation}` : "",
						""
					]
					return parts.filter((part) => part).join("\n")
				})
				.join("\n")

			const header = `Found ${data.meta.total} crates matching "${args.query}" (showing top ${data.crates.length}):\n\n`

			return {
				content: [
					{
						type: "text",
						text: header + results
					}
				]
			}
		} catch (error) {
			// Log the error with full context
			if (error instanceof Error) {
				ErrorLogger.log(error)
			}

			let errorMessage: string
			if (error instanceof Error && error.name === "AbortError") {
				errorMessage = "Request timed out while searching crates.io"
			} else if (error instanceof NetworkError) {
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
						text: `Error searching crates: ${errorMessage}`
					}
				],
				isError: true
			}
		}
	}
}

// Helper function to suggest similar crate names
export const suggestSimilarCrates = async (crateName: string, limit = 5): Promise<string[]> => {
	try {
		const searchUrl = `https://crates.io/api/v1/crates?q=${encodeURIComponent(crateName)}&per_page=${limit}`

		// Add timeout to prevent hanging requests
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

		const response = await fetch(searchUrl, {
			headers: {
				"User-Agent": "mcp-docsrs/1.0.0"
			},
			signal: controller.signal
		})

		clearTimeout(timeoutId)

		if (!response.ok) {
			return []
		}

		const data = (await response.json()) as CratesIoSearchResponse
		return data.crates.map((crate) => crate.name)
	} catch (error) {
		ErrorLogger.log(error as Error)
		return []
	}
}

// Prompt arguments schema for search_crates
export const searchCratesPromptSchema = {
	query: z.string().optional().describe("Search query for crate names (supports partial matches)"),
	limit: z.number().optional().describe("Maximum number of results to return")
}

// Prompt for search_crates with dynamic argument handling
export const searchCratesPrompt = {
	name: "search_crates",
	description: "Search for Rust crates on crates.io",
	argsSchema: searchCratesPromptSchema,
	handler: (args: any) => {
		// Check if required arguments are missing
		if (!args?.query) {
			return {
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: "What would you like to search for on crates.io? Please provide a search query (e.g., 'serde', 'async', 'web framework')."
						}
					}
				]
			}
		}

		// Build the prompt text with the provided arguments
		let promptText = `Search for Rust crates matching "${args.query}" on crates.io`

		if (args.limit) {
			promptText += ` (limiting to ${args.limit} results)`
		}

		promptText += `. I'll search for matching crates and show you the results.`

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
