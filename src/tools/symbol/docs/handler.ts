import type { DocsFetcher } from "../../../docs/types.ts"
import { ItemNotFoundError } from "../../../errors.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import { findSymbol } from "../shared.ts"
import type { SymbolDocsInput } from "./types.ts"

const createSymbolDocsHandler =
	(fetcher: DocsFetcher): ToolHandler<SymbolDocsInput> =>
	async (args) => {
		try {
			const { data } = await fetcher.load(args)
			const match = findSymbol(data, args)
			if (!match) {
				throw new ItemNotFoundError(args.crateName, `${args.symbolType}.${args.symbolname}`)
			}

			return createTextResult(match.item.docs ?? "No symbol documentation available.")
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createSymbolDocsHandler }
