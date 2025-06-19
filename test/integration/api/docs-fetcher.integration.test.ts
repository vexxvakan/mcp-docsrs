import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { createDocsFetcher } from "../../../src/docs-fetcher.js"

describe("DocsFetcher", () => {
	let fetcher: ReturnType<typeof createDocsFetcher>

	beforeEach(() => {
		fetcher = createDocsFetcher({
			cacheTtl: 1000,
			maxCacheSize: 10,
			requestTimeout: 5000
		})
	})

	afterEach(() => {
		fetcher.close()
	})

	describe("buildJsonUrl", () => {
		it("should build correct URL with defaults", async () => {
			// Mock fetch to capture the URL
			const originalFetch = global.fetch
			let capturedUrl = ""

			global.fetch = mock((url: string | URL | Request) => {
				if (typeof url === "string") {
					capturedUrl = url
				} else if (url instanceof URL) {
					capturedUrl = url.toString()
				} else {
					capturedUrl = url.url
				}
				return Promise.resolve({
					status: 404,
					ok: false,
					headers: new Headers(),
					json: () => Promise.resolve({})
				} as Response)
			}) as unknown as typeof fetch

			try {
				await fetcher.fetchCrateJson("test-crate")
			} catch {}

			expect(capturedUrl).toBe("https://docs.rs/crate/test-crate/latest/json")

			global.fetch = originalFetch
		})

		it("should build URL with version", async () => {
			const originalFetch = global.fetch
			let capturedUrl = ""

			global.fetch = mock((url: string | URL | Request) => {
				if (typeof url === "string") {
					capturedUrl = url
				} else if (url instanceof URL) {
					capturedUrl = url.toString()
				} else {
					capturedUrl = url.url
				}
				return Promise.resolve({
					status: 404,
					ok: false,
					headers: new Headers(),
					json: () => Promise.resolve({})
				} as Response)
			}) as unknown as typeof fetch

			try {
				await fetcher.fetchCrateJson("test-crate", "1.0.0")
			} catch {}

			expect(capturedUrl).toBe("https://docs.rs/crate/test-crate/1.0.0/json")

			global.fetch = originalFetch
		})

		it("should build URL with target", async () => {
			const originalFetch = global.fetch
			let capturedUrl = ""

			global.fetch = mock((url: string | URL | Request) => {
				if (typeof url === "string") {
					capturedUrl = url
				} else if (url instanceof URL) {
					capturedUrl = url.toString()
				} else {
					capturedUrl = url.url
				}
				return Promise.resolve({
					status: 404,
					ok: false,
					headers: new Headers(),
					json: () => Promise.resolve({})
				} as Response)
			}) as unknown as typeof fetch

			try {
				await fetcher.fetchCrateJson("test-crate", "1.0.0", "x86_64-pc-windows-msvc")
			} catch {}

			expect(capturedUrl).toBe(
				"https://docs.rs/crate/test-crate/1.0.0/x86_64-pc-windows-msvc/json"
			)

			global.fetch = originalFetch
		})
	})

	describe("fetchCrateJson", () => {
		it("should handle 404 errors", () => {
			const originalFetch = global.fetch

			global.fetch = mock(() => {
				return Promise.resolve({
					status: 404,
					ok: false,
					headers: new Headers(),
					json: () => Promise.resolve({})
				} as Response)
			}) as unknown as typeof fetch

			expect(fetcher.fetchCrateJson("non-existent-crate")).rejects.toThrow(
				/Crate 'non-existent-crate' not found/
			)

			global.fetch = originalFetch
		})

		it("should handle timeouts", () => {
			const originalFetch = global.fetch

			global.fetch = mock(() => {
				return new Promise((_, reject) => {
					setTimeout(() => {
						const error = new Error("Aborted")
						error.name = "AbortError"
						reject(error)
					}, 100)
				})
			}) as unknown as typeof fetch

			const quickFetcher = createDocsFetcher({ requestTimeout: 50 })

			expect(quickFetcher.fetchCrateJson("test-crate")).rejects.toThrow(
				/Request timeout after 50ms/
			)

			quickFetcher.close()
			global.fetch = originalFetch
		})

		it("should cache successful responses", async () => {
			const originalFetch = global.fetch
			let fetchCount = 0
			const testData = { test: "data", format_version: 30 }

			global.fetch = mock(() => {
				fetchCount++
				return Promise.resolve({
					status: 200,
					ok: true,
					headers: new Headers(),
					json: () => Promise.resolve(testData),
					text: () => Promise.resolve(JSON.stringify(testData)),
					bodyUsed: false
				} as Response)
			}) as unknown as typeof fetch

			// First call should fetch
			const result1 = await fetcher.fetchCrateJson("test-crate")
			expect(result1.data).toEqual(testData)
			expect(result1.fromCache).toBe(false)
			expect(fetchCount).toBe(1)

			// Second call should use cache
			const result2 = await fetcher.fetchCrateJson("test-crate")
			expect(result2.data).toEqual(testData)
			expect(result2.fromCache).toBe(true)
			expect(fetchCount).toBe(1) // No additional fetch

			global.fetch = originalFetch
		})

		it("should handle normal JSON responses", async () => {
			const originalFetch = global.fetch
			const testData = { test: "uncompressed", format_version: 30 }

			global.fetch = mock(() => {
				return Promise.resolve({
					status: 200,
					ok: true,
					headers: new Headers(),
					bodyUsed: false,
					json: () => Promise.resolve(testData),
					text: () => Promise.resolve(JSON.stringify(testData))
				} as Response)
			}) as unknown as typeof fetch

			const result = await fetcher.fetchCrateJson("test-crate")
			expect(result.data).toEqual(testData)
			expect(result.fromCache).toBe(false)

			global.fetch = originalFetch
		})
	})

	describe("cache operations", () => {
		it("should clear cache", async () => {
			const originalFetch = global.fetch
			let fetchCount = 0
			const testData = { test: "data" }

			global.fetch = mock(() => {
				fetchCount++
				return Promise.resolve({
					status: 200,
					ok: true,
					headers: new Headers(),
					json: () => Promise.resolve(testData),
					text: () => Promise.resolve(JSON.stringify(testData))
				} as Response)
			}) as unknown as typeof fetch

			// First fetch
			await fetcher.fetchCrateJson("test-crate")
			expect(fetchCount).toBe(1)

			// Clear cache
			fetcher.clearCache()

			// Should fetch again
			await fetcher.fetchCrateJson("test-crate")
			expect(fetchCount).toBe(2)

			global.fetch = originalFetch
		})
	})
})
