import { afterEach, describe, expect, it } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createCache } from "../src/cache.js"

describe("Persistent Cache", () => {
	const testDbPath = join(tmpdir(), `test-cache-${Date.now()}.db`)

	afterEach(() => {
		// Clean up test database
		if (existsSync(testDbPath)) {
			rmSync(testDbPath, { force: true })
		}
	})

	it("should create database file when dbPath is provided", () => {
		const cache = createCache(10, testDbPath)

		// Set a value
		cache.set("test-key", { data: "test-value" }, 3600000)

		// Check that the database file was created
		expect(existsSync(testDbPath)).toBe(true)

		cache.close()
	})

	it("should persist data across cache instances", () => {
		// Create first cache instance and set data
		const cache1 = createCache(10, testDbPath)
		cache1.set("persistent-key", { value: "persistent-data" }, 3600000)
		cache1.close()

		// Create second cache instance and verify data persists
		const cache2 = createCache(10, testDbPath)
		const retrieved = cache2.get("persistent-key")

		expect(retrieved).toEqual({ value: "persistent-data" })

		cache2.close()
	})

	it("should handle nested directory creation", () => {
		const nestedPath = join(tmpdir(), "nested", "dirs", `test-cache-${Date.now()}.db`)

		const cache = createCache(10, nestedPath)
		cache.set("test", { data: "value" }, 3600000)

		expect(existsSync(nestedPath)).toBe(true)

		cache.close()

		// Clean up nested directories
		rmSync(join(tmpdir(), "nested"), { recursive: true, force: true })
	})

	it("should use in-memory database when dbPath is not provided", () => {
		const cache = createCache(10)

		// Should work normally
		cache.set("memory-key", { data: "memory-value" }, 3600000)
		const retrieved = cache.get("memory-key")

		expect(retrieved).toEqual({ data: "memory-value" })

		cache.close()
	})

	it("should use in-memory database when dbPath is ':memory:'", () => {
		const cache = createCache(10, ":memory:")

		// Should work normally
		cache.set("memory-key", { data: "memory-value" }, 3600000)
		const retrieved = cache.get("memory-key")

		expect(retrieved).toEqual({ data: "memory-value" })

		cache.close()
	})
})
