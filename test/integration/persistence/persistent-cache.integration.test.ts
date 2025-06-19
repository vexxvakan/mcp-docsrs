import { afterEach, describe, expect, it } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createCache } from "../../../src/cache.js"

describe("Persistent Cache", () => {
	const testDbPath = join(tmpdir(), `test-cache-${Date.now()}.db`)

	afterEach(async () => {
		// Add a small delay on Windows to ensure file handles are released
		if (process.platform === "win32") {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		// Clean up test database
		if (existsSync(testDbPath)) {
			try {
				rmSync(testDbPath, { force: true })
			} catch (error) {
				// If still locked, try again after a longer delay
				if ((error as any).code === "EBUSY" && process.platform === "win32") {
					await new Promise((resolve) => setTimeout(resolve, 500))
					rmSync(testDbPath, { force: true })
				} else {
					throw error
				}
			}
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

	it("should handle nested directory creation", async () => {
		const nestedPath = join(tmpdir(), "nested", "dirs", `test-cache-${Date.now()}.db`)

		const cache = createCache(10, nestedPath)
		cache.set("test", { data: "value" }, 3600000)

		expect(existsSync(nestedPath)).toBe(true)

		cache.close()

		// Add delay on Windows before cleanup
		if (process.platform === "win32") {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		// Clean up nested directories
		try {
			rmSync(join(tmpdir(), "nested"), { recursive: true, force: true })
		} catch (error) {
			if ((error as any).code === "EBUSY" && process.platform === "win32") {
				await new Promise((resolve) => setTimeout(resolve, 500))
				rmSync(join(tmpdir(), "nested"), { recursive: true, force: true })
			} else {
				throw error
			}
		}
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
