// biome-ignore-all lint/style/useNamingConvention: crates.io API uses snake_case keys
import { rankCrates } from "../../docs/classifier/rank.ts"
import type { SearchCrate } from "../../docs/classifier/types.ts"
import { ErrorLogger, NetworkError } from "../../errors.ts"
import { APP_USER_AGENT } from "../../meta.ts"
import { FIND_LIMIT_DEFAULT } from "./find/schema.ts"
import type { CratesIoCrate, CratesIoFindResponse } from "./find/types.ts"

const MILLISECONDS_PER_SECOND = 1000
const FIND_TIMEOUT_SECONDS = 5
const FIND_TIMEOUT_MS = FIND_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
const FIND_FETCH_LIMIT_MIN = 50
const FIND_FETCH_LIMIT_MAX = 100
const CRATES_IO_FIND_URL = "https://crates.io/api/v1/crates"

const getFetchLimit = (limit: number) =>
	Math.min(FIND_FETCH_LIMIT_MAX, Math.max(limit * FIND_LIMIT_DEFAULT, FIND_FETCH_LIMIT_MIN))

const fetchFindResponse = async (query: string, limit: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), FIND_TIMEOUT_MS)
	const url = `${CRATES_IO_FIND_URL}?q=${encodeURIComponent(query)}&per_page=${limit}`

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

const toSearchCrate = (crate: CratesIoCrate): SearchCrate => ({
	createdAt: crate.created_at,
	description: crate.description,
	documentation: crate.documentation,
	downloads: crate.downloads,
	homepage: crate.homepage,
	maxVersion: crate.max_version,
	name: crate.name,
	recentDownloads: crate.recent_downloads,
	repository: crate.repository,
	updatedAt: crate.updated_at
})

const loadRankedCrates = async (query: string, limit: number) => {
	const result = await fetchFindResponse(query, getFetchLimit(limit))
	return {
		ranked: rankCrates(query, result.crates.map(toSearchCrate)).slice(0, limit),
		total: result.meta.total
	}
}

const findSimilarCrates = async (crateName: string, limit = FIND_LIMIT_DEFAULT) => {
	try {
		const { ranked } = await loadRankedCrates(crateName, limit)
		return ranked.map((candidate) => candidate.crate.name)
	} catch (error) {
		ErrorLogger.log(error)
		return []
	}
}

export { fetchFindResponse, findSimilarCrates, loadRankedCrates }
