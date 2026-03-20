import { z } from "zod"
import type { DocsFetcher } from "../docs/types.ts"
import { ErrorLogger, ItemNotFoundError } from "../errors.ts"
import { findItem } from "../rustdoc/index.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "./shared.ts"
import type { LookupItemArgs, ToolHandler } from "./types.ts"

const lookupItemInputSchema = {
	crateName: z.string().describe("Name of the Rust crate"),
	itemPath: z
		.string()
		.describe('Path to a specific item, for example "struct.Runtime" or "fn.spawn"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}

const lookupItemTool = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Item Documentation"
	},
	description: "Lookup documentation for a specific item in a Rust crate",
	inputSchema: lookupItemInputSchema,
	name: "lookup_item_docs"
}

const createLookupItemHandler =
	(fetcher: DocsFetcher): ToolHandler<LookupItemArgs> =>
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
				itemPath: args.itemPath
			})

			const content = findItem(data, args.itemPath)
			if (!content) {
				throw new ItemNotFoundError(args.crateName, args.itemPath)
			}

			return createTextResult(content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createLookupItemHandler, lookupItemInputSchema, lookupItemTool }
