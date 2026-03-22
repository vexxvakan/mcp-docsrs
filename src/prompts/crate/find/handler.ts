import { createPromptResult } from "../../shared.ts"
import type { PromptHandler } from "../../types.ts"
import type { CrateFindPromptArgs } from "./types.ts"

const createCrateFindPromptHandler = (): PromptHandler<CrateFindPromptArgs> => (args) => {
	if (!args.query) {
		return createPromptResult(
			"What would you like to search for on crates.io? Please provide a crate name or topic."
		)
	}

	return createPromptResult(
		`Find Rust crates matching "${args.query}"${args.limit ? ` with a limit of ${args.limit}` : ""} using the crate_find tool. Summarize the most relevant matches and explain why they look useful.`
	)
}

export { createCrateFindPromptHandler }
