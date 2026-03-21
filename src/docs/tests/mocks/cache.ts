import { mock } from "bun:test"
import type { CacheEntry, CacheStore } from "../../../cache/types.ts"
import type { Crate } from "../../rustdoc/types/items.ts"

const createCacheEntry = (data: Crate | null): CacheEntry<Crate> => ({
	data,
	isHit: data !== null
})

const createCacheStoreMock = (
	entry: CacheEntry<Crate> | null = createCacheEntry(null)
): CacheStore => ({
	clear: mock(() => undefined),
	close: mock(() => undefined),
	delete: mock((_key: string) => undefined),
	get: mock((_key: string) => entry),
	set: mock((_key: string, _value: Crate, _ttl: number) => undefined)
})

export { createCacheEntry, createCacheStoreMock }
