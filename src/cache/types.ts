type CacheStore<T> = {
	clear: () => void
	close: () => void
	delete: (key: string) => void
	get: (key: string) => T | null
	getWithMetadata: (key: string) => {
		data: T | null
		isHit: boolean
	}
	set: (key: string, value: T, ttl: number) => void
}

export type { CacheStore }
