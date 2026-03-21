import { z } from "zod"
import { createPromptResult } from "../../shared.ts"
import type { PromptDefinition } from "../../types.ts"

const crateLookupPromptArgs = {
	crateName: z.string().optional().describe("Name of the Rust crate to analyze"),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}

const crateLookupPrompt: PromptDefinition<"crate_lookup", typeof crateLookupPromptArgs> = {
	argsSchema: crateLookupPromptArgs,
	description: "Analyze a Rust crate overview, public API surface, and main modules",
	handler: (args) => {
		if (!args.crateName) {
			return createPromptResult(
				"Which Rust crate would you like to analyze? Please provide the crate name."
			)
		}

		const versionText = args.version ? ` version ${args.version}` : ""
		return createPromptResult(
			`Please analyze the Rust crate "${args.crateName}"${versionText} using the crate_lookup tool.`
		)
	},
	name: "crate_lookup"
}

export { crateLookupPrompt }
