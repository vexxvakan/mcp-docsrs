import { z } from "zod"
import { createPromptResult } from "../../shared.ts"
import type { PromptDefinition } from "../../types.ts"

const crateFindPromptArgs = {
	limit: z.number().optional().describe("Maximum number of results to return"),
	query: z.string().optional().describe("Search query for crate names")
}

const crateFindPrompt: PromptDefinition<"crate_find", typeof crateFindPromptArgs> = {
	argsSchema: crateFindPromptArgs,
	description: "Find relevant Rust crates on crates.io",
	handler: (args) => {
		if (!args.query) {
			return createPromptResult(
				"What would you like to search for on crates.io? Please provide a crate name or topic."
			)
		}

		return createPromptResult(
			`Find Rust crates matching "${args.query}"${args.limit ? ` with a limit of ${args.limit}` : ""} using the crate_find tool. Summarize the most relevant matches and explain why they look useful.`
		)
	},
	name: "crate_find"
}

export { crateFindPrompt }
