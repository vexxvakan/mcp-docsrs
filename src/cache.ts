import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { CacheError, ErrorLogger } from "./errors.js"

// Create or get cache database
const createCacheDb = (dbPath = ":memory:") => {
	try {
		// Create directory if using file-based database
		if (dbPath !== ":memory:") {
			const dir = dirname(dbPath)
			mkdirSync(dir, { recursive: true })
		}

		const db = new Database(dbPath)

		// Create cache table if it doesn't exist
		db.run(`
			CREATE TABLE IF NOT EXISTS cache (
				key TEXT PRIMARY KEY,
				data TEXT NOT NULL,
				timestamp INTEGER NOT NULL,
				ttl INTEGER NOT NULL
			)
		`)

		// Create index for faster lookups
		db.run("CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache(timestamp)")

		return db
	} catch (error) {
		throw new CacheError("set", `Failed to create cache database: ${(error as Error).message}`)
	}
}

// Create a cache with SQLite (in-memory or file-based)
export const createCache = <T>(maxSize = 100, dbPath?: string) => {
	const db = createCacheDb(dbPath)

	// Prepare statements for better performance
	const getStmt = db.prepare("SELECT data, timestamp, ttl FROM cache WHERE key = ?")
	const setStmt = db.prepare(`
		INSERT OR REPLACE INTO cache (key, data, timestamp, ttl) 
		VALUES (?, ?, ?, ?)
	`)
	const deleteStmt = db.prepare("DELETE FROM cache WHERE key = ?")
	const clearStmt = db.prepare("DELETE FROM cache")
	const countStmt = db.prepare("SELECT COUNT(*) as count FROM cache")
	const oldestStmt = db.prepare("SELECT key FROM cache ORDER BY timestamp ASC LIMIT 1")

	// Clean up expired entries
	const cleanupExpired = () => {
		const now = Date.now()
		db.run("DELETE FROM cache WHERE timestamp + ttl < ?", [now])
	}

	// Get a value from cache with metadata
	const getWithMetadata = (key: string): { data: T | null; isHit: boolean } => {
		try {
			cleanupExpired()

			const result = getStmt.get(key) as {
				data: string
				timestamp: number
				ttl: number
			} | null

			if (!result) return { data: null, isHit: false }

			// Check if entry is expired
			if (Date.now() > result.timestamp + result.ttl) {
				deleteStmt.run(key)
				return { data: null, isHit: false }
			}

			return { data: JSON.parse(result.data), isHit: true }
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw new CacheError("get", `Failed to get key '${key}': ${(error as Error).message}`)
		}
	}

	// Get a value from cache (legacy method)
	const get = (key: string): T | null => {
		const { data } = getWithMetadata(key)
		return data
	}

	// Set a value in cache
	const set = (key: string, value: T, ttl: number): void => {
		try {
			// Enforce max size
			const count = (countStmt.get() as { count: number }).count
			if (count >= maxSize) {
				// Remove oldest entry
				const oldest = oldestStmt.get() as { key: string } | null
				if (oldest) {
					deleteStmt.run(oldest.key)
				}
			}

			setStmt.run(key, JSON.stringify(value), Date.now(), ttl)
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw new CacheError("set", `Failed to set key '${key}': ${(error as Error).message}`)
		}
	}

	// Delete a value from cache
	const remove = (key: string): void => {
		try {
			deleteStmt.run(key)
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw new CacheError(
				"delete",
				`Failed to delete key '${key}': ${(error as Error).message}`
			)
		}
	}

	// Clear all cache
	const clear = (): void => {
		try {
			clearStmt.run()
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw new CacheError("clear", `Failed to clear cache: ${(error as Error).message}`)
		}
	}

	// Close the database
	const close = (): void => {
		try {
			db.close()
		} catch (error) {
			ErrorLogger.log(error as Error)
			throw new CacheError(
				"close",
				`Failed to close cache database: ${(error as Error).message}`
			)
		}
	}

	return {
		get,
		getWithMetadata,
		set,
		delete: remove,
		clear,
		close
	}
}

export type Cache<T> = ReturnType<typeof createCache<T>>
