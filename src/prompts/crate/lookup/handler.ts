import { createPromptResult, createTargetText, createVersionText } from "../../shared.ts"
import type { PromptHandler } from "../../types.ts"
import type { CrateLookupPromptArgs } from "./types.ts"

const createCrateLookupPromptHandler = (): PromptHandler<CrateLookupPromptArgs> => (args) => {
	if (!args.crateName) {
		return createPromptResult(
			"Which Rust crate would you like to analyze? Please provide the crate name."
		)
	}

	return createPromptResult(
		`Please analyze the Rust crate "${args.crateName}"${createVersionText(args.version)}${createTargetText(args.target)} using the crate_lookup tool.`
	)
}

export { createCrateLookupPromptHandler }
