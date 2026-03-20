// biome-ignore-all lint/style/useNamingConvention: crates.io API uses snake_case keys
import { z } from "zod"
import { ErrorLogger, NetworkError } from "../errors.ts"
import { APP_USER_AGENT } from "../meta.ts"
import { createErrorResult, createTextResult, toErrorMessage } from "./shared.ts"
import type { SearchCratesArgs, ToolHandler } from "./types.ts"

const MILLISECONDS_PER_SECOND = 1000
const SEARCH_TIMEOUT_SECONDS = 5
const SEARCH_TIMEOUT_MS = SEARCH_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
const SEARCH_LIMIT_DEFAULT = 10

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

type CratesIoSearchResponse = {
	crates: CratesIoCrate[]
	meta: {
		total: number
	}
}

const searchCratesInputSchema = {
	limit: z
		.number()
		.optional()
		.default(SEARCH_LIMIT_DEFAULT)
		.describe("Maximum number of results to return"),
	query: z.string().describe("Search query for crate names (supports partial matches)")
}

const searchCratesTool = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Search Rust Crates"
	},
	description: "Search for Rust crates on crates.io with fuzzy and partial name matching",
	inputSchema: searchCratesInputSchema,
	name: "search_crates"
}

const fetchSearchResponse = async (query: string, limit: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
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

		return (await response.json()) as CratesIoSearchResponse
	} finally {
		clearTimeout(timeoutId)
	}
}

const formatSearchResults = (query: string, data: CratesIoSearchResponse) => {
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

const suggestSimilarCrates = async (crateName: string, limit = SEARCH_LIMIT_DEFAULT) => {
	try {
		const result = await fetchSearchResponse(crateName, limit)
		return result.crates.map((crateInfo) => crateInfo.name)
	} catch (error) {
		ErrorLogger.log(error)
		return []
	}
}

const createSearchCratesHandler = (): ToolHandler<SearchCratesArgs> => async (args) => {
	try {
		const result = await fetchSearchResponse(args.query, args.limit ?? SEARCH_LIMIT_DEFAULT)
		return createTextResult(formatSearchResults(args.query, result))
	} catch (error) {
		const message =
			error instanceof Error && error.name === "AbortError"
				? "Request timed out while searching crates.io"
				: toErrorMessage(error)
		return createErrorResult(`Error searching crates: ${message}`)
	}
}

export {
	createSearchCratesHandler,
	searchCratesInputSchema,
	searchCratesTool,
	suggestSimilarCrates
}
