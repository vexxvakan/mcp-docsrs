import { z } from "zod"
import type { DocsFetcher } from "../../docs/types.ts"
import { ErrorLogger } from "../../errors.ts"
import { suggestSimilarCrates } from "../search-crates.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../shared.ts"
import type { ToolDefinition, ToolHandler } from "../types.ts"
import type { CrateArgs, CrateInputSchema } from "./types.ts"

const crateInputSchema: CrateInputSchema = {
	crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
	formatVersion: z.number().optional().describe("Rustdoc JSON format version"),
	target: z.string().optional().describe('Target platform, for example "i686-pc-windows-msvc"'),
	version: z
		.string()
		.optional()
		.describe('Specific version or semver range, for example "1.0.0" or "~4"')
}

const crateLookupTool: ToolDefinition<"crate_lookup", CrateInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Crate"
	},
	description: "Lookup Rust crate structure and public API overview from docs.rs",
	inputSchema: crateInputSchema,
	name: "crate_lookup"
}

const formatSuggestionMessage = async (crateName: string, message: string) => {
	const suggestions = await suggestSimilarCrates(crateName)
	const alternatives = suggestions.filter((suggestion) => suggestion !== crateName)
	if (alternatives.length === 0) {
		return message
	}

	return `${message}\n\nDid you mean one of these crates?\n${alternatives.map((value) => `- ${value}`).join("\n")}`
}

const createCrateLookupHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateArgs> =>
	async (args) => {
		try {
			const { content, fromCache } = await fetcher.lookupCrate(args)
			ErrorLogger.logInfo("Crate overview retrieved", {
				crateName: args.crateName,
				fromCache
			})
			return createTextResult(content)
		} catch (error) {
			const message = await formatSuggestionMessage(args.crateName, toErrorMessage(error))
			return createErrorResult(`Error: ${message}`)
		}
	}

export { crateInputSchema, crateLookupTool, createCrateLookupHandler }
