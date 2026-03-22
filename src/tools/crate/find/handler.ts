import type { SearchCrate } from "../../../docs/classifier/types.ts"
import { createErrorResult, createStructuredResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import { loadRankedCrates } from "../shared.ts"
import { FIND_LIMIT_DEFAULT } from "./schema.ts"
import type { FindCratesArgs, FindCratesOutput } from "./types.ts"

const createFindOutput = (
	query: string,
	total: number,
	ranked: {
		crate: SearchCrate
	}[]
): FindCratesOutput => ({
	crates: ranked.map(({ crate }) => crate),
	query,
	returned: ranked.length,
	total
})

const createFindSummary = (result: FindCratesOutput) =>
	result.returned === 0
		? `No crates found matching "${result.query}".`
		: `Found ${result.returned} crates matching "${result.query}" out of ${result.total} total.`

const createCrateFindHandler = (): ToolHandler<FindCratesArgs> => async (args) => {
	try {
		const limit = args.limit ?? FIND_LIMIT_DEFAULT
		const result = await loadRankedCrates(args.query, limit)
		const structuredContent = createFindOutput(args.query, result.total, result.ranked)
		return createStructuredResult(structuredContent, createFindSummary(structuredContent))
	} catch (error) {
		const message =
			error instanceof Error && error.name === "AbortError"
				? "Request timed out while searching crates.io"
				: toErrorMessage(error)
		return createErrorResult(`Error finding crates: ${message}`)
	}
}

export { createCrateFindHandler }
