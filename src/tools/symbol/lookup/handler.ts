import type { DocsFetcher } from "../../../docs/types.ts"
import { ErrorLogger, ItemNotFoundError } from "../../../errors.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import type { SymbolLookupInput } from "./types.ts"

const createLookupSymbolHandler =
	(fetcher: DocsFetcher): ToolHandler<SymbolLookupInput> =>
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

export { createLookupSymbolHandler }
