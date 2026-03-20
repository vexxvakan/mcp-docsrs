import { z } from "zod"
import type { DocsFetcher } from "../docs/types.ts"
import { ErrorLogger, ItemNotFoundError } from "../errors.ts"
import { findItem } from "../rustdoc/index.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "./shared.ts"
import type {
	LookupSymbolArgs,
	LookupSymbolInputSchema,
	ToolDefinition,
	ToolHandler
} from "./types.ts"

const lookupSymbolInputSchema: LookupSymbolInputSchema = {
	crateName: z.string().describe("Name of the Rust crate"),
	symbolPath: z
		.string()
		.describe('Path to a specific Symbol, for example "struct.Runtime" or "fn.spawn"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}

const lookupSymbolTool: ToolDefinition<"lookup_symbol", LookupSymbolInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust symbol documentation"
	},
	description: "Lookup documentation for a specific symbol in a Rust crate",
	inputSchema: lookupSymbolInputSchema,
	name: "lookup_symbol"
}

const createLookupSymbolHandler =
	(fetcher: DocsFetcher): ToolHandler<LookupSymbolArgs> =>
	async (args) => {
		try {
			const { data, fromCache } = await fetcher.fetchCrateJson(
				args.crateName,
				args.version,
				args.target
			)
			ErrorLogger.logInfo("Item documentation retrieved", {
				crateName: args.crateName,
				fromCache,
				itemPath: args.symbolPath
			})

			const content = findItem(data, args.symbolPath)
			if (!content) {
				throw new ItemNotFoundError(args.crateName, args.symbolPath)
			}

			return createTextResult(content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createLookupSymbolHandler, lookupSymbolInputSchema, lookupSymbolTool }
