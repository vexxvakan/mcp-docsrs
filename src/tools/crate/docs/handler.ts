import type { DocsFetcher } from "../../../docs/types.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import type { CrateDocsInput } from "./types.ts"

const createCrateDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateDocsInput> =>
	async (args) => {
		try {
			const { content } = await fetcher.lookupCrateDocs(args)
			return createTextResult(content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createCrateDocsHandler }
