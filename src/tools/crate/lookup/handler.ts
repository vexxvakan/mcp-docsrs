import type { DocsFetcher } from "../../../docs/types.ts"
import { createErrorResult, createStructuredResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import { findSimilarCrates } from "../shared.ts"
import type { CrateLookupInput } from "./types.ts"

const createCrateLookupHandler =
	(fetcher: DocsFetcher): ToolHandler<CrateLookupInput> =>
	async (args) => {
		try {
			const result = await fetcher.lookupCrate(args)
			return createStructuredResult(result.structuredContent, result.content)
		} catch (error) {
			let message = toErrorMessage(error)
			const suggestions = await findSimilarCrates(args.crateName)
			const alternatives = suggestions.filter((suggestion) => suggestion !== args.crateName)
			if (alternatives.length === 0) {
				return createErrorResult(`Error: ${message}`)
			}
			message = `${message}\nDid you mean one of these crates?\n${alternatives.map((value) => `- ${value}`).join("\n")}`
			return createErrorResult(`Error: ${message}`)
		}
	}

export { createCrateLookupHandler }
