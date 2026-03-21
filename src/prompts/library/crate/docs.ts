import { z } from "zod"
import { createPromptResult } from "../../shared.ts"
import type { PromptDefinition } from "../../types.ts"

const crateDocsPromptArgs = {
	crateName: z.string().optional().describe("Name of the Rust crate to inspect"),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}

const crateDocsPrompt: PromptDefinition<"crate_docs", typeof crateDocsPromptArgs> = {
	argsSchema: crateDocsPromptArgs,
	description: "Inspect full crate-level Rust documentation text",
	handler: (args) => {
		if (!args.crateName) {
			return createPromptResult(
				"Which Rust crate would you like full crate-level documentation for? Please provide the crate name."
			)
		}

		const versionText = args.version ? ` version ${args.version}` : ""
		return createPromptResult(
			`Please retrieve and analyze the full crate-level documentation for the Rust crate "${args.crateName}"${versionText} using the crate_docs tool. Focus on the crate's purpose, usage guidance, major caveats, and the most important concepts introduced in the docs.`
		)
	},
	name: "crate_docs"
}

export { crateDocsPrompt }
