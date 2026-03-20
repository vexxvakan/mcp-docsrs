import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { CacheError, ErrorLogger } from "../errors.ts"
import type { JsonValue } from "../shared/types.ts"
import type { CacheEntry, CacheStatements, CacheStore } from "./types.ts"

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

const parseStoredValue = (value: string) => JSON.parse(value) as JsonValue

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
	(db: Database, statements: CacheStatements) =>
	<T>(key: string): CacheEntry<T> => {
		try {
			cleanupExpired(db)
			const result = statements.getStmt.get(key)

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
				data: parseStoredValue(result.data) as T,
				isHit: true
			}
		} catch (error) {
			throw new CacheError("get", (error as Error).message)
		}
	}

const createSet =
	(statements: CacheStatements, maxSize: number) =>
	(key: string, value: JsonValue, ttl: number) => {
		try {
			const count = statements.countStmt.get()?.count ?? 0
			if (count >= maxSize) {
				const oldest = statements.oldestStmt.get()
				if (oldest) {
					statements.deleteStmt.run(oldest.key)
				}
			}

			statements.setStmt.run(key, JSON.stringify(value), Date.now(), ttl)
		} catch (error) {
			throw new CacheError("set", (error as Error).message)
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

const createCache = (maxSize: number, dbPath?: string): CacheStore => {
	const normalizedPath = toCacheDbPath(dbPath)
	const db = createDb(normalizedPath)
	const statements = createStatements(db)
	const getWithMetadata = createGetWithMetadata(db, statements)

	ErrorLogger.logInfo("Cache ready", {
		dbPath: normalizedPath
	})

	return {
		clear: () => statements.clearStmt.run(),
		close: createClose(db, statements),
		delete: (key: string) => statements.deleteStmt.run(key),
		get: <T>(key: string) => getWithMetadata<T>(key).data,
		getWithMetadata,
		set: createSet(statements, maxSize)
	}
}

export { createCache }
