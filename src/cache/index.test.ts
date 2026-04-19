import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test"
import { rmSync } from "node:fs"
import { join } from "node:path"
import { createQueryJson } from "../../tests/fixtures/docs.ts"
import { CacheError } from "../errors.ts"
import type { CacheRecordRow } from "./types.ts"

type CacheScenario = {
	closeError?: Error
	countOverride?: number
	createError?: Error
	deleteCalls: string[]
	finalizeCalls: string[]
	getError?: Error
	highestTimestampKey?: string
	lastCleanupArgs: unknown[] | null
	path: string | null
	records: Map<string, CacheRecordRow>
	setError?: Error
}

const createScenario = (): CacheScenario => ({
	deleteCalls: [],
	finalizeCalls: [],
	lastCleanupArgs: null,
	path: null,
	records: new Map()
})

const scenario = createScenario()

const freshRow = (data = createQueryJson(), ttl = 60_000): CacheRecordRow => ({
	data: JSON.stringify(data),
	timestamp: Date.now(),
	ttl
})

class FakeStatement {
	constructor(private readonly sql: string) {}

	finalize() {
		scenario.finalizeCalls.push(this.sql)
		if (scenario.closeError && this.sql === "close") {
			throw scenario.closeError
		}
	}

	get(...args: unknown[]) {
		const sql = this.sql.trimStart()

		if (sql.startsWith("SELECT COUNT(*)")) {
			return {
				count: scenario.countOverride ?? scenario.records.size
			}
		}

		if (sql.startsWith("SELECT key FROM cache")) {
			if (scenario.highestTimestampKey) {
				return {
					key: scenario.highestTimestampKey
				}
			}

			const oldest = [
				...scenario.records.entries()
			].sort((left, right) => left[1].timestamp - right[1].timestamp)[0]
			return oldest
				? {
						key: oldest[0]
					}
				: null
		}

		if (sql.startsWith("SELECT data, timestamp, ttl FROM cache")) {
			if (scenario.getError) {
				throw scenario.getError
			}

			return scenario.records.get(String(args[0])) ?? null
		}

		return
	}

	run(...args: unknown[]) {
		const sql = this.sql.trimStart()

		if (sql.startsWith("DELETE FROM cache WHERE timestamp + ttl < ?")) {
			scenario.lastCleanupArgs = args
			return
		}

		if (sql.startsWith("DELETE FROM cache WHERE key = ?")) {
			scenario.deleteCalls.push(String(args[0]))
			scenario.records.delete(String(args[0]))
			return
		}

		if (sql.startsWith("DELETE FROM cache")) {
			scenario.records.clear()
			return
		}

		if (sql.startsWith("INSERT OR REPLACE INTO cache")) {
			if (scenario.setError) {
				throw scenario.setError
			}

			const [key, data, timestamp, ttl] = args as [
				string,
				string,
				number,
				number
			]
			scenario.records.set(key, {
				data,
				timestamp,
				ttl
			})
		}

		return
	}
}

class FakeDatabase {
	constructor(path: string) {
		if (scenario.createError) {
			throw scenario.createError
		}

		scenario.path = path
	}

	close() {
		if (scenario.closeError) {
			throw scenario.closeError
		}
	}

	prepare(sql: string) {
		return new FakeStatement(sql) as unknown as never
	}

	run(sql: string, ...args: unknown[]) {
		return new FakeStatement(sql).run(...args)
	}
}

mock.module("bun:sqlite", () => ({
	Database: FakeDatabase
}))

let createCache: typeof import("./index.ts").createCache

beforeAll(async () => {
	;({ createCache } = await import("./index.ts"))
})

afterEach(() => {
	scenario.closeError = undefined
	scenario.countOverride = undefined
	scenario.createError = undefined
	scenario.deleteCalls = []
	scenario.finalizeCalls = []
	scenario.getError = undefined
	scenario.highestTimestampKey = undefined
	scenario.lastCleanupArgs = null
	scenario.path = null
	scenario.records = new Map()
	scenario.setError = undefined
	rmSync(join(process.cwd(), ".tmp", "cache-tests"), {
		force: true,
		recursive: true
	})
})

describe("createCache", () => {
	test("normalizes cache paths and skips directory creation for memory databases", async () => {
		const memoryCache = createCache(1)
		expect(scenario.path).toBe(":memory:")

		const explicitMemoryCache = createCache(1, ":memory:")
		expect(scenario.path).toBe(":memory:")

		const directoryPath = join(process.cwd(), ".tmp", "cache-tests", "nested")
		const directoryCache = createCache(1, directoryPath)
		expect(scenario.path).toBe(`${directoryPath}/cache.db`)

		const filePath = join(process.cwd(), ".tmp", "cache-tests", "cache.db")
		const fileCache = createCache(1, filePath)
		expect(scenario.path).toBe(filePath)

		memoryCache.close()
		explicitMemoryCache.close()
		directoryCache.close()
		fileCache.close()
	})

	test("returns fresh hits and deletes stale entries on read", async () => {
		const cache = createCache(2)
		const fresh = createQueryJson()
		const expired = createQueryJson()

		scenario.records.set("fresh", {
			data: JSON.stringify(fresh),
			timestamp: Date.now(),
			ttl: 60_000
		})
		scenario.records.set("expired", {
			data: JSON.stringify(expired),
			timestamp: Date.now() - 120_000,
			ttl: 1
		})

		expect(cache.get("fresh")).toEqual({
			data: fresh,
			isHit: true
		})
		expect(cache.get("expired")).toEqual({
			data: null,
			isHit: false
		})
		expect(scenario.deleteCalls).toContain("expired")
		expect((scenario.lastCleanupArgs?.[0] as number[])[0]).toBeTypeOf("number")

		cache.close()
	})

	test("evicts the oldest record and supports delete and clear", async () => {
		const cache = createCache(1)

		scenario.records.set("oldest", {
			data: JSON.stringify(createQueryJson()),
			timestamp: Date.now() - 10_000,
			ttl: 60_000
		})
		scenario.records.set("newer", {
			data: JSON.stringify(createQueryJson()),
			timestamp: Date.now() - 1000,
			ttl: 60_000
		})
		scenario.countOverride = 2

		cache.set("latest", createQueryJson(), 30_000)
		cache.delete("latest")
		cache.clear()

		expect(scenario.deleteCalls).toContain("oldest")
		expect(scenario.records.size).toBe(0)

		cache.close()
	})

	test("wraps close failures", () => {
		const cache = createCache(1)
		scenario.closeError = new Error("close failed")

		expect(() => cache.close()).toThrow(CacheError)
		expect(() => cache.close()).toThrow("Cache operation 'close' failed: close failed")
	})

	test.each([
		{
			arrange: () => {
				scenario.createError = new Error("create failed")
				return () => createCache(1, join(process.cwd(), ".tmp", "cache-tests", "broken.db"))
			},
			error: "create"
		},
		{
			arrange: () => {
				scenario.getError = new Error("get failed")
				scenario.records.set("boom", freshRow())
				return () => createCache(1).get("boom")
			},
			error: "get"
		},
		{
			arrange: () => {
				scenario.setError = new Error("set failed")
				return () => createCache(1).set("boom", createQueryJson(), 1000)
			},
			error: "set"
		}
	])("$error failures are wrapped as cache errors", ({ arrange, error }) => {
		const operation = arrange()

		expect(operation).toThrow(CacheError)
		expect(operation).toThrow(`Cache operation '${error}' failed`)
	})
})
