type SqlValue = Uint8Array | bigint | boolean | null | number | string
type SqlRow = Record<string, SqlValue>
type SqlParams = SqlValue[]

type CacheStats = {
	oldestEntry: Date | null
	totalEntries: number
	totalSize: number
}

type CacheEntry = {
	expiresAt: Date
	key: string
	size: number
	timestamp: Date
	ttl: number
}

type CacheStore<T> = {
	clear: () => void
	close: () => void
	delete: (key: string) => void
	get: (key: string) => T | null
	getStats: () => CacheStats
	getWithMetadata: (key: string) => {
		data: T | null
		isHit: boolean
	}
	listEntries: (limit?: number, offset?: number) => CacheEntry[]
	query: (sql: string, params?: SqlParams) => SqlRow[]
	set: (key: string, value: T, ttl: number) => void
}

export type { CacheEntry, CacheStats, CacheStore, SqlParams, SqlRow, SqlValue }
