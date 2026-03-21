import { z } from "zod"
import { createPromptResult } from "../../shared.ts"
import type { PromptDefinition } from "../../types.ts"

const lookupSymbolPromptArgs = {
	crateName: z.string().optional().describe("Name of the Rust crate"),
	expandDocs: z
		.boolean()
		.optional()
		.describe("When true, request the full symbol documentation instead of the preview"),
	symbolname: z
		.string()
		.optional()
		.describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.optional()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}

const lookupSymbolPrompt: PromptDefinition<"lookup_symbol", typeof lookupSymbolPromptArgs> = {
	argsSchema: lookupSymbolPromptArgs,
	description: "Inspect a specific Rust symbol from a crate",
	handler: (args) => {
		if (!(args.crateName || args.symbolname || args.symbolType)) {
			return createPromptResult(
				'I need the crate name, symbol type, and symbol name. For example: crateName "tokio", symbolType "struct", symbolname "runtime::Runtime".'
			)
		}
		if (!args.crateName) {
			return createPromptResult(
				`Which Rust crate contains the ${args.symbolType ?? "symbol"} "${args.symbolname ?? "unknown"}"? Please provide the crate name.`
			)
		}
		if (!args.symbolType) {
			return createPromptResult(
				`What rustdoc symbol type should I use for "${args.symbolname ?? "this symbol"}" in the crate "${args.crateName}"? For example "struct", "function", or "trait".`
			)
		}
		if (!args.symbolname) {
			return createPromptResult(
				`What symbol name or path from the "${args.crateName}" crate would you like me to inspect as a ${args.symbolType}?`
			)
		}

		const versionText = args.version ? ` version ${args.version}` : ""
		const docsMode = args.expandDocs
			? "Request the full documentation body."
			: "Use the default documentation preview unless more detail is required."
		return createPromptResult(
			`Please inspect the ${args.symbolType} "${args.symbolname}" from the Rust crate "${args.crateName}"${versionText} using the lookup_symbol tool. ${docsMode} Summarize its purpose, important fields or parameters, related items, and any notable constraints or caveats.`
		)
	},
	name: "lookup_symbol"
}

export { lookupSymbolPrompt }
