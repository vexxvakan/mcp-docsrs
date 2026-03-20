import { z } from "zod"
import type { DocsFetcher } from "../docs/types.ts"
import { ErrorLogger } from "../errors.ts"
import { suggestSimilarCrates } from "./search-crates.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "./shared.ts"
import type {
	LookupCrateArgs,
	LookupCrateInputSchema,
	ToolDefinition,
	ToolHandler
} from "./types.ts"

const lookupCrateInputSchema: LookupCrateInputSchema = {
	crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
	formatVersion: z.number().optional().describe("Rustdoc JSON format version"),
	target: z.string().optional().describe('Target platform, for example "i686-pc-windows-msvc"'),
	version: z
		.string()
		.optional()
		.describe('Specific version or semver range, for example "1.0.0" or "~4"')
}

const lookupCrateTool: ToolDefinition<"lookup_crate", LookupCrateInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Crate Documentation"
	},
	description: "Lookup documentation for a Rust crate from docs.rs",
	inputSchema: lookupCrateInputSchema,
	name: "lookup_crate"
}

const formatSuggestionMessage = async (crateName: string, message: string) => {
	const suggestions = await suggestSimilarCrates(crateName)
	const alternatives = suggestions.filter((suggestion) => suggestion !== crateName)
	if (alternatives.length === 0) {
		return message
	}

	return `${message}\n\nDid you mean one of these crates?\n${alternatives.map((value) => `- ${value}`).join("\n")}`
}

const createLookupCrateHandler =
	(fetcher: DocsFetcher): ToolHandler<LookupCrateArgs> =>
	async (args) => {
		try {
			const { content, fromCache } = await fetcher.lookupCrate(args)
			ErrorLogger.logInfo("Crate documentation retrieved", {
				crateName: args.crateName,
				fromCache
			})
			return createTextResult(content)
		} catch (error) {
			const message = await formatSuggestionMessage(args.crateName, toErrorMessage(error))
			return createErrorResult(`Error: ${message}`)
		}
	}

export { createLookupCrateHandler, lookupCrateInputSchema, lookupCrateTool }
