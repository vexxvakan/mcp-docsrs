import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

const searchCratesPromptArgs = {
	limit: z.number().optional().describe("Maximum number of results to return"),
	query: z.string().optional().describe("Search query for crate names")
}

const createPromptResult = (text: string): GetPromptResult => ({
	messages: [
		{
			content: {
				text,
				type: "text"
			},
			role: "user"
		}
	]
})

const searchCratesPrompt = {
	argsSchema: searchCratesPromptArgs,
	description: "Search for Rust crates on crates.io",
	handler: (args: { limit?: number; query?: string }) => {
		if (!args.query) {
			return createPromptResult(
				"What would you like to search for on crates.io? Please provide a crate name or topic."
			)
		}

		return createPromptResult(
			`Search for Rust crates matching "${args.query}"${args.limit ? ` with a limit of ${args.limit}` : ""}. Summarize the most relevant matches and why they look useful.`
		)
	},
	name: "search_crates"
}

export { searchCratesPrompt }
