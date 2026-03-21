import { z } from "zod"
import type { DocsFetcher } from "../docs/types.ts"
import { ErrorLogger, ItemNotFoundError } from "../errors.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "./shared.ts"
import type {
	LookupSymbolArgs,
	LookupSymbolInputSchema,
	ToolDefinition,
	ToolHandler
} from "./types.ts"

const lookupSymbolInputSchema: LookupSymbolInputSchema = {
	crateName: z.string().describe("Name of the Rust crate"),
	expandDocs: z
		.boolean()
		.optional()
		.default(false)
		.describe("When true, return the full documentation text instead of the preview"),
	symbolname: z.string().describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
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
			const result = await fetcher.lookupSymbol(args)
			if (!result) {
				throw new ItemNotFoundError(args.crateName, `${args.symbolType}.${args.symbolname}`)
			}
			ErrorLogger.logInfo("Item documentation retrieved", {
				crateName: args.crateName,
				fromCache: result.fromCache,
				itemPath: `${args.symbolType}.${args.symbolname}`
			})

			return createTextResult(result.content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createLookupSymbolHandler, lookupSymbolInputSchema, lookupSymbolTool }
