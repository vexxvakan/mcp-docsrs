import type { DocsFetcher } from "../../docs/types.ts"
import { ErrorLogger } from "../../errors.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../shared.ts"
import type { ToolDefinition, ToolHandler } from "../types.ts"
import { crateInputSchema } from "./lookup.ts"
import type { CrateArgs, CrateInputSchema } from "./types.ts"

const crateDocsTool: ToolDefinition<"crate_docs", CrateInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Crate Docs"
	},
	description: "Lookup full crate-level documentation from docs.rs",
	inputSchema: crateInputSchema,
	name: "crate_docs"
}

const createCrateDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateArgs> =>
	async (args) => {
		try {
			const { content, fromCache } = await fetcher.lookupCrateDocs(args)
			ErrorLogger.logInfo("Crate docs retrieved", {
				crateName: args.crateName,
				fromCache
			})
			return createTextResult(content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { crateDocsTool, createCrateDocsHandler }
