import { mock } from "bun:test"
import type { CacheEntry, CacheStore } from "../../../cache/types.ts"
import type { JsonValue } from "../../../shared/types.ts"
import type { RustdocJson } from "../../types.ts"

const createCacheEntry = (data: RustdocJson | null): CacheEntry<RustdocJson> => ({
	data,
	isHit: data !== null
})

const createCacheStoreMock = (
	entry: CacheEntry<RustdocJson> | null = createCacheEntry(null)
): CacheStore => ({
	clear: mock(() => undefined),
	close: mock(() => undefined),
	delete: mock((_key: string) => undefined),
	get: mock((_key: string) => entry),
	set: mock((_key: string, _value: JsonValue, _ttl: number) => undefined)
})

export { createCacheEntry, createCacheStoreMock }
