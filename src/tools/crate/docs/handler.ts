import type { DocsFetcher } from "../../../docs/types.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import type { CrateDocsArgs } from "./types.ts"

const createCrateDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateDocsArgs> =>
	async (args) => {
		try {
			const { content } = await fetcher.lookupCrateDocs(args)
			return createTextResult(content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createCrateDocsHandler }
