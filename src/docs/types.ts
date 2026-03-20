import type { CacheEntry, CacheStats, SqlRow } from "../cache/types.ts"
import type { RustdocJson } from "../rustdoc/types.ts"

type DocsFetchResult = {
	data: RustdocJson
	fromCache: boolean
}

type DocsFetcher = {
	clearCache: () => void
	close: () => void
	fetchCrateJson: (
		crateName: string,
		version?: string,
		target?: string,
		formatVersion?: number
	) => Promise<DocsFetchResult>
	getCacheEntries: (limit: number, offset: number) => CacheEntry[]
	getCacheStats: () => CacheStats
	queryCacheDb: (sql: string) => SqlRow[]
}

export type { DocsFetcher, DocsFetchResult }
