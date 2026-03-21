// biome-ignore-all lint/style/useNamingConvention: crates.io API uses snake_case keys
import { z } from "zod"
import { ErrorLogger, NetworkError } from "../../errors.ts"
import { APP_USER_AGENT } from "../../meta.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "../shared.ts"
import type { ToolDefinition, ToolHandler } from "../types.ts"
import type { FindCratesArgs, FindCratesInputSchema } from "./types.ts"

const MILLISECONDS_PER_SECOND = 1000
const FIND_TIMEOUT_SECONDS = 5
const FIND_TIMEOUT_MS = FIND_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
const FIND_LIMIT_DEFAULT = 10

type CratesIoCrate = {
	description: string | null
	documentation: string | null
	downloads: number
	homepage: string | null
	max_version: string
	name: string
	recent_downloads: number
	repository: string | null
}

type CratesIoFindResponse = {
	crates: CratesIoCrate[]
	meta: {
		total: number
	}
}

const crateFindInputSchema: FindCratesInputSchema = {
	limit: z
		.number()
		.optional()
		.default(FIND_LIMIT_DEFAULT)
		.describe("Maximum number of results to return"),
	query: z.string().describe("Search query for crate names (supports partial matches)")
}

const crateFindTool: ToolDefinition<"crate_find", FindCratesInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Find Rust Crates"
	},
	description: "Search for Rust crates on crates.io with fuzzy and partial name matching",
	inputSchema: crateFindInputSchema,
	name: "crate_find"
}

const fetchFindResponse = async (query: string, limit: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), FIND_TIMEOUT_MS)
	const url = `https://crates.io/api/v1/crates?q=${encodeURIComponent(query)}&per_page=${limit}`

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": APP_USER_AGENT
			},
			signal: controller.signal
		})

		if (!response.ok) {
			throw new NetworkError(url, response.status, response.statusText)
		}

		return (await response.json()) as CratesIoFindResponse
	} finally {
		clearTimeout(timeoutId)
	}
}

const formatFindResults = (query: string, data: CratesIoFindResponse) => {
	if (data.crates.length === 0) {
		return `No crates found matching "${query}"`
	}

	const lines = data.crates.map((crateInfo, index) =>
		[
			`${index + 1}. **${crateInfo.name}** v${crateInfo.max_version}`,
			crateInfo.description ? `   ${crateInfo.description}` : "",
			`   Downloads: ${crateInfo.downloads.toLocaleString()} (${crateInfo.recent_downloads.toLocaleString()} recent)`,
			crateInfo.documentation ? `   Docs: ${crateInfo.documentation}` : ""
		]
			.filter(Boolean)
			.join("\n")
	)

	return `Found ${data.meta.total} crates matching "${query}" (showing top ${data.crates.length}):\n\n${lines.join("\n\n")}`
}

const findSimilarCrates = async (crateName: string, limit = FIND_LIMIT_DEFAULT) => {
	try {
		const result = await fetchFindResponse(crateName, limit)
		return result.crates.map((crateInfo) => crateInfo.name)
	} catch (error) {
		ErrorLogger.log(error)
		return []
	}
}

const createCrateFindHandler = (): ToolHandler<FindCratesArgs> => async (args) => {
	try {
		const result = await fetchFindResponse(args.query, args.limit ?? FIND_LIMIT_DEFAULT)
		return createTextResult(formatFindResults(args.query, result))
	} catch (error) {
		const message =
			error instanceof Error && error.name === "AbortError"
				? "Request timed out while searching crates.io"
				: toErrorMessage(error)
		return createErrorResult(`Error finding crates: ${message}`)
	}
}

export { crateFindInputSchema, crateFindTool, createCrateFindHandler, findSimilarCrates }
