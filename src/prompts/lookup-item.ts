import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

const lookupItemPromptArgs = {
	crateName: z.string().optional().describe("Name of the Rust crate"),
	itemPath: z.string().optional().describe("Path to the Rust item"),
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

const lookupItemPrompt = {
	argsSchema: lookupItemPromptArgs,
	description: "Provide detailed information about a specific item from a Rust crate",
	handler: (args: { crateName?: string; itemPath?: string; target?: string; version?: string }) => {
		if (!(args.crateName || args.itemPath)) {
			return createPromptResult(
				"I need the crate name and the item path. Please provide both, for example crate 'tokio' and item 'struct.Runtime'."
			)
		}
		if (!args.crateName) {
			return createPromptResult(
				`Which Rust crate contains the item "${args.itemPath}"? Please provide the crate name.`
			)
		}
		if (!args.itemPath) {
			return createPromptResult(
				`What specific item from the "${args.crateName}" crate would you like documentation for?`
			)
		}

		const versionText = args.version ? ` version ${args.version}` : ""
		return createPromptResult(
			`Please provide detailed information about "${args.itemPath}" from the Rust crate "${args.crateName}"${versionText}. Include purpose, key types, relevant fields or parameters, and related items.`
		)
	},
	name: "lookup_item_docs"
}

export { lookupItemPrompt }
