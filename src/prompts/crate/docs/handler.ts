import { createPromptResult, createTargetText, createVersionText } from "../../shared.ts"
import type { PromptHandler } from "../../types.ts"
import type { CrateDocsPromptArgs } from "./types.ts"

const createCrateDocsPromptHandler = (): PromptHandler<CrateDocsPromptArgs> => (args) => {
	if (!args.crateName) {
		return createPromptResult(
			"Which Rust crate would you like full crate-level documentation for? Please provide the crate name."
		)
	}

	return createPromptResult(
		`Please retrieve and analyze the full crate-level documentation for the Rust crate "${args.crateName}"${createVersionText(args.version)}${createTargetText(args.target)} using the crate_docs tool. Focus on the crate's purpose, usage guidance, major caveats, and the most important concepts introduced in the docs.`
	)
}

export { createCrateDocsPromptHandler }
