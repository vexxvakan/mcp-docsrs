import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { CacheError, ErrorLogger } from "../errors.ts"
import type { CacheEntry, CacheStats, CacheStore, SqlParams, SqlRow } from "./types.ts"

const DEFAULT_LIMIT = 100
const MEMORY_DB = ":memory:"

const toCacheDbPath = (dbPath: string | undefined) => {
	if (!dbPath || dbPath === MEMORY_DB) {
		return dbPath ?? MEMORY_DB
	}

	if (dbPath.endsWith(".db")) {
		return dbPath
	}

	return dbPath.endsWith("/") ? `${dbPath}cache.db` : `${dbPath}/cache.db`
}

const ensureDbDir = (dbPath: string) => {
	if (dbPath === MEMORY_DB) {
		return
	}

	mkdirSync(dirname(dbPath), {
		recursive: true
	})
}

const createDb = (dbPath: string) => {
	try {
		ensureDbDir(dbPath)
		const db = new Database(dbPath)
		db.run(`
			CREATE TABLE IF NOT EXISTS cache (
				key TEXT PRIMARY KEY,
				data TEXT NOT NULL,
				timestamp INTEGER NOT NULL,
				ttl INTEGER NOT NULL
			)
		`)
		db.run("CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache(timestamp)")
		return db
	} catch (error) {
		throw new CacheError("create", (error as Error).message)
	}
}

const cleanupExpired = (db: Database) => {
	db.run("DELETE FROM cache WHERE timestamp + ttl < ?", [
		Date.now()
	])
}

const parseStoredValue = <T>(value: string) => JSON.parse(value) as T

const toCacheEntry = (row: {
	key: string
	size: number
	timestamp: number
	ttl: number
}): CacheEntry => ({
	expiresAt: new Date(row.timestamp + row.ttl),
	key: row.key,
	size: row.size,
	timestamp: new Date(row.timestamp),
	ttl: row.ttl
})

type CacheStatements = {
	clearStmt: ReturnType<Database["prepare"]>
	countStmt: ReturnType<Database["prepare"]>
	deleteStmt: ReturnType<Database["prepare"]>
	getStmt: ReturnType<Database["prepare"]>
	oldestStmt: ReturnType<Database["prepare"]>
	setStmt: ReturnType<Database["prepare"]>
}

const createStatements = (db: Database): CacheStatements => ({
	clearStmt: db.prepare("DELETE FROM cache"),
	countStmt: db.prepare("SELECT COUNT(*) as count FROM cache"),
	deleteStmt: db.prepare("DELETE FROM cache WHERE key = ?"),
	getStmt: db.prepare("SELECT data, timestamp, ttl FROM cache WHERE key = ?"),
	oldestStmt: db.prepare("SELECT key FROM cache ORDER BY timestamp ASC LIMIT 1"),
	setStmt: db.prepare(`
		INSERT OR REPLACE INTO cache (key, data, timestamp, ttl)
		VALUES (?, ?, ?, ?)
	`)
})

const createGetWithMetadata =
	<T>(db: Database, statements: CacheStatements) =>
	(key: string) => {
		try {
			cleanupExpired(db)
			const result = statements.getStmt.get(key) as {
				data: string
				timestamp: number
				ttl: number
			} | null

			if (!result || Date.now() > result.timestamp + result.ttl) {
				if (result) {
					statements.deleteStmt.run(key)
				}

				return {
					data: null,
					isHit: false
				}
			}

			return {
				data: parseStoredValue<T>(result.data),
				isHit: true
			}
		} catch (error) {
			throw new CacheError("get", (error as Error).message)
		}
	}

const createSet =
	<T>(statements: CacheStatements, maxSize: number) =>
	(key: string, value: T, ttl: number) => {
		try {
			const count = (
				statements.countStmt.get() as {
					count: number
				}
			).count
			if (count >= maxSize) {
				const oldest = statements.oldestStmt.get() as {
					key: string
				} | null
				if (oldest) {
					statements.deleteStmt.run(oldest.key)
				}
			}

			statements.setStmt.run(key, JSON.stringify(value), Date.now(), ttl)
		} catch (error) {
			throw new CacheError("set", (error as Error).message)
		}
	}

const createListEntries =
	(db: Database) =>
	(limit = DEFAULT_LIMIT, offset = 0) => {
		try {
			cleanupExpired(db)
			const rows = db
				.prepare(`
				SELECT key, timestamp, ttl, LENGTH(data) as size
				FROM cache
				ORDER BY timestamp DESC
				LIMIT ? OFFSET ?
			`)
				.all(limit, offset) as Array<{
				key: string
				size: number
				timestamp: number
				ttl: number
			}>
			return rows.map(toCacheEntry)
		} catch (error) {
			throw new CacheError("list", (error as Error).message)
		}
	}

const createGetStats = (db: Database, statements: CacheStatements) => (): CacheStats => {
	try {
		const totalEntries = (
			statements.countStmt.get() as {
				count: number
			}
		).count
		const sizeRow = db.prepare("SELECT SUM(LENGTH(data)) as totalSize FROM cache").get() as {
			totalSize: number | null
		}
		const oldestRow = db.prepare("SELECT MIN(timestamp) as oldest FROM cache").get() as {
			oldest: number | null
		}

		return {
			oldestEntry: oldestRow.oldest ? new Date(oldestRow.oldest) : null,
			totalEntries,
			totalSize: sizeRow.totalSize ?? 0
		}
	} catch (error) {
		throw new CacheError("stats", (error as Error).message)
	}
}

const createQuery =
	(db: Database) =>
	(sql: string, params: SqlParams = []): SqlRow[] => {
		try {
			cleanupExpired(db)
			return db.prepare(sql).all(...params) as SqlRow[]
		} catch (error) {
			throw new CacheError("query", (error as Error).message)
		}
	}

const createClose = (db: Database, statements: CacheStatements) => () => {
	try {
		statements.getStmt.finalize()
		statements.setStmt.finalize()
		statements.deleteStmt.finalize()
		statements.clearStmt.finalize()
		statements.countStmt.finalize()
		statements.oldestStmt.finalize()
		db.close()
	} catch (error) {
		throw new CacheError("close", (error as Error).message)
	}
}

const createCache = <T>(maxSize: number, dbPath?: string): CacheStore<T> => {
	const normalizedPath = toCacheDbPath(dbPath)
	const db = createDb(normalizedPath)
	const statements = createStatements(db)
	const getWithMetadata = createGetWithMetadata<T>(db, statements)

	ErrorLogger.logInfo("Cache ready", {
		dbPath: normalizedPath
	})

	return {
		clear: () => statements.clearStmt.run(),
		close: createClose(db, statements),
		delete: (key: string) => statements.deleteStmt.run(key),
		get: (key: string) => getWithMetadata(key).data,
		getStats: createGetStats(db, statements),
		getWithMetadata,
		listEntries: createListEntries(db),
		query: createQuery(db),
		set: createSet(statements, maxSize)
	}
}

export { createCache }
