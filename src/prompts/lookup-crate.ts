import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

const lookupCratePromptArgs = {
	crateName: z.string().optional().describe("Name of the Rust crate to analyze"),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
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

const lookupCratePrompt = {
	argsSchema: lookupCratePromptArgs,
	description: "Analyze and summarize documentation for a Rust crate",
	handler: (args: { crateName?: string; target?: string; version?: string }) => {
		if (!args.crateName) {
			return createPromptResult(
				"Which Rust crate would you like me to look up documentation for? Please provide the crate name."
			)
		}

		const versionText = args.version ? ` version ${args.version}` : ""
		return createPromptResult(
			`Please analyze and summarize the documentation for the Rust crate "${args.crateName}"${versionText}. Focus on the main purpose, key types and functions, usage patterns, and important warnings.`
		)
	},
	name: "lookup_crate_docs"
}

export { lookupCratePrompt }
