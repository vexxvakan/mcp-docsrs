import { ensureRoot } from "@mcp-docsrs/docs/shared.ts"
import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import type { CrateDocsInput } from "./types.ts"

const createCrateDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateDocsInput> =>
	async (args) => {
		try {
			const { data } = await fetcher.load(args)
			const root = ensureRoot(data)
			return createTextResult(root.docs ?? "No crate-level documentation available.")
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createCrateDocsHandler }
