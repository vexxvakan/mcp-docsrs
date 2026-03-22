import type { DocsFetcher } from "../../../docs/types.ts"
import { ItemNotFoundError } from "../../../errors.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import type { SymbolDocsInput } from "./types.ts"

const createSymbolDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<SymbolDocsInput> =>
	async (args) => {
		try {
			const result = await fetcher.lookupSymbolDocs(args)
			if (!result) {
				throw new ItemNotFoundError(args.crateName, `${args.symbolType}.${args.symbolname}`)
			}

			return createTextResult(result.content)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createSymbolDocsHandler }
