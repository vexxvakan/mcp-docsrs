import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDocsFetcher } from "../../../src/docs-fetcher.js"

describe("Cache Status Tracking", () => {
	let testDbPath: string
	let fetcher: ReturnType<typeof createDocsFetcher>

	beforeEach(() => {
		// Create unique database path for each test to avoid conflicts
		testDbPath = join(
			tmpdir(),
			`test-cache-status-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.db`
		)

		// Create fetcher with persistent database for testing
		fetcher = createDocsFetcher({
			dbPath: testDbPath,
			cacheTtl: 3600000, // 1 hour
			maxCacheSize: 10
		})
	})

	afterEach(async () => {
		// Clean up
		fetcher.close()

		// Add a small delay on Windows to ensure file handles are released
		if (process.platform === "win32") {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

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

	it("should return fromCache: false on first fetch", async () => {
		const result = await fetcher.fetchCrateJson("tinc", "0.1.6")

		expect(result.fromCache).toBe(false)
		expect(result.data).toBeDefined()
		expect(result.data.root).toBeDefined() // Basic validation of rustdoc JSON structure
	}, 10000)

	it("should return fromCache: true on subsequent fetch", async () => {
		// First fetch - should hit the network
		const firstResult = await fetcher.fetchCrateJson("tinc", "0.1.6")
		expect(firstResult.fromCache).toBe(false)

		// Second fetch - should hit the cache
		const secondResult = await fetcher.fetchCrateJson("tinc", "0.1.6")
		expect(secondResult.fromCache).toBe(true)

		// Data should be identical
		expect(secondResult.data).toEqual(firstResult.data)
	}, 10000)

	it("should persist cache across fetcher instances", async () => {
		// First fetcher instance
		const result1 = await fetcher.fetchCrateJson("tinc", "0.1.6")
		expect(result1.fromCache).toBe(false)
		fetcher.close()

		// Create new fetcher instance with same database
		const fetcher2 = createDocsFetcher({
			dbPath: testDbPath,
			cacheTtl: 3600000,
			maxCacheSize: 10
		})

		// Should get cached result
		const result2 = await fetcher2.fetchCrateJson("tinc", "0.1.6")
		expect(result2.fromCache).toBe(true)
		expect(result2.data).toEqual(result1.data)

		fetcher2.close()
	}, 10000)

	it("should handle different versions separately", async () => {
		// Fetch latest version
		const latestResult = await fetcher.fetchCrateJson("tinc", "latest")
		expect(latestResult.fromCache).toBe(false)

		// Fetch a recent version that should have rustdoc JSON
		const versionResult = await fetcher.fetchCrateJson("tinc", "0.1.6")
		expect(versionResult.fromCache).toBe(false) // Different cache key

		// Fetch latest again - should be cached
		const latestAgain = await fetcher.fetchCrateJson("tinc", "latest")
		expect(latestAgain.fromCache).toBe(true)

		// Fetch the specific version again - should also be cached
		const versionAgain = await fetcher.fetchCrateJson("tinc", "0.1.6")
		expect(versionAgain.fromCache).toBe(true)
	}, 15000)

	it("should track cache misses for non-existent crates", async () => {
		try {
			await fetcher.fetchCrateJson("this-crate-definitely-does-not-exist-12345")
			// Should not reach here
			expect(true).toBe(false)
		} catch (_error) {
			// Error is expected, but let's verify cache behavior

			// Try again - should still fail (not cached)
			try {
				await fetcher.fetchCrateJson("this-crate-definitely-does-not-exist-12345")
				expect(true).toBe(false)
			} catch (secondError) {
				// Expected - errors are not cached
				expect(secondError).toBeDefined()
			}
		}
	}, 10000)

	it("should work with in-memory cache", async () => {
		// Create fetcher with in-memory cache
		const memoryFetcher = createDocsFetcher({
			cacheTtl: 3600000,
			maxCacheSize: 10
			// No dbPath - uses in-memory cache
		})

		const firstResult = await memoryFetcher.fetchCrateJson("tinc")
		expect(firstResult.fromCache).toBe(false)

		const secondResult = await memoryFetcher.fetchCrateJson("tinc")
		expect(secondResult.fromCache).toBe(true)

		memoryFetcher.close()
	}, 10000)

	it("should respect cache TTL", async () => {
		// Create fetcher with very short TTL
		const shortTtlFetcher = createDocsFetcher({
			dbPath: join(tmpdir(), `test-ttl-${Date.now()}.db`),
			cacheTtl: 100, // 100ms
			maxCacheSize: 10
		})

		const firstResult = await shortTtlFetcher.fetchCrateJson("tinc")
		expect(firstResult.fromCache).toBe(false)

		// Wait for TTL to expire
		await new Promise((resolve) => setTimeout(resolve, 150))

		// Should fetch again as cache expired
		const secondResult = await shortTtlFetcher.fetchCrateJson("tinc")
		expect(secondResult.fromCache).toBe(false)

		shortTtlFetcher.close()

		// Clean up with delay on Windows
		if (process.platform === "win32") {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
		rmSync(join(tmpdir(), `test-ttl-${Date.now()}.db`), { force: true })
	}, 10000)
})
