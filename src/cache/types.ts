import type { Statement } from "bun:sqlite"
import type { Crate } from "../docs/rustdoc/types/items.ts"

type CacheEntry<T> = {
	data: T | null
	isHit: boolean
}

type CacheCountRow = {
	count: number
}

type CacheRecordRow = {
	data: string
	timestamp: number
	ttl: number
}

type CacheOldestRow = {
	key: string
}

type CacheStatements = {
	clearStmt: Statement
	countStmt: Statement<CacheCountRow>
	deleteStmt: Statement
	getStmt: Statement<CacheRecordRow>
	oldestStmt: Statement<CacheOldestRow>
	setStmt: Statement
}

type CacheStore = {
	clear: () => void
	close: () => void
	delete: (key: string) => void
	get: (key: string) => CacheEntry<Crate> | null
	set: (key: string, value: Crate, ttl: number) => void
}

export type {
	CacheCountRow,
	CacheEntry,
	CacheOldestRow,
	CacheRecordRow,
	CacheStatements,
	CacheStore
}
