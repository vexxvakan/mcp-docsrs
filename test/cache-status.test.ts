import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDocsFetcher } from "../src/docs-fetcher.js"

describe("Cache Status Tracking", () => {
	const testDbPath = join(tmpdir(), `test-cache-status-${Date.now()}.db`)
	let fetcher: ReturnType<typeof createDocsFetcher>

	beforeEach(() => {
		// Create fetcher with persistent database for testing
		fetcher = createDocsFetcher({
			dbPath: testDbPath,
			cacheTtl: 3600000, // 1 hour
			maxCacheSize: 10
		})
	})

	afterEach(() => {
		// Clean up
		fetcher.close()
		if (existsSync(testDbPath)) {
			rmSync(testDbPath, { force: true })
		}
	})

	it("should return fromCache: false on first fetch", async () => {
		const result = await fetcher.fetchCrateJson("tinc")

		expect(result.fromCache).toBe(false)
		expect(result.data).toBeDefined()
		expect(result.data.root).toBeDefined() // Basic validation of rustdoc JSON structure
	})

	it("should return fromCache: true on subsequent fetch", async () => {
		// First fetch - should hit the network
		const firstResult = await fetcher.fetchCrateJson("tinc")
		expect(firstResult.fromCache).toBe(false)

		// Second fetch - should hit the cache
		const secondResult = await fetcher.fetchCrateJson("tinc")
		expect(secondResult.fromCache).toBe(true)

		// Data should be identical
		expect(secondResult.data).toEqual(firstResult.data)
	})

	it("should persist cache across fetcher instances", async () => {
		// First fetcher instance
		const result1 = await fetcher.fetchCrateJson("tinc")
		expect(result1.fromCache).toBe(false)
		fetcher.close()

		// Create new fetcher instance with same database
		const fetcher2 = createDocsFetcher({
			dbPath: testDbPath,
			cacheTtl: 3600000,
			maxCacheSize: 10
		})

		// Should get cached result
		const result2 = await fetcher2.fetchCrateJson("tinc")
		expect(result2.fromCache).toBe(true)
		expect(result2.data).toEqual(result1.data)

		fetcher2.close()
	})

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
	})

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
	})

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
	})

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
		rmSync(join(tmpdir(), `test-ttl-${Date.now()}.db`), { force: true })
	})
})
