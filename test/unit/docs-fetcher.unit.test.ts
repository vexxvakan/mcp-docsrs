import { beforeEach, describe, expect, it } from "bun:test"
import { createDocsFetcher } from "../../src/docs-fetcher"
import {
	createMockCache,
	mockFetch,
	mockFetchResponses,
	mockRustdocJson,
	resetMocks
} from "./mocks"

// Mock the global fetch
global.fetch = mockFetch as any

describe("DocsFetcher (Unit Tests)", () => {
	let fetcher: ReturnType<typeof createDocsFetcher>
	let mockCache: ReturnType<typeof createMockCache>

	beforeEach(() => {
		resetMocks()
		mockCache = createMockCache()

		// Create fetcher with mock cache
		fetcher = createDocsFetcher({
			cache: mockCache as any,
			cacheTtl: 3600000,
			maxCacheSize: 10
		})
	})

	describe("URL construction", () => {
		it("should construct correct URL with defaults", async () => {
			const url = "https://docs.rs/crate/serde/latest/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("serde")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with version", async () => {
			const url = "https://docs.rs/crate/serde/1.0.0/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("serde", "1.0.0")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with target", async () => {
			const url = "https://docs.rs/crate/serde/latest/wasm32-unknown-unknown/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("serde", undefined, "wasm32-unknown-unknown")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with all parameters", async () => {
			const url = "https://docs.rs/crate/serde/1.0.0/wasm32-unknown-unknown/json/30"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("serde", "1.0.0", "wasm32-unknown-unknown", 30)
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})
	})

	describe("fetchCrateJson", () => {
		it("should fetch and parse JSON response", async () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			const result = await fetcher.fetchCrateJson("test_crate")

			expect(result.fromCache).toBe(false)
			expect(result.data).toEqual(mockRustdocJson)
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should return cached data on second fetch", async () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			// First fetch
			await fetcher.fetchCrateJson("test_crate")

			// Second fetch should hit cache
			const result = await fetcher.fetchCrateJson("test_crate")

			expect(result.fromCache).toBe(true)
			expect(result.data).toEqual(mockRustdocJson)
			expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once
		})

		it("should handle 404 errors", async () => {
			const url = "https://docs.rs/crate/nonexistent/latest/json"
			mockFetchResponses.set(url, {
				ok: false,
				status: 404,
				statusText: "Not Found"
			})

			await expect(fetcher.fetchCrateJson("nonexistent")).rejects.toThrow(
				"Crate 'nonexistent' not found"
			)
		})

		it("should handle network errors", async () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			mockFetchResponses.set(url, {
				error: new Error("Network error")
			})

			await expect(fetcher.fetchCrateJson("test_crate")).rejects.toThrow("Network error")
		})

		// Note: zstd decompression is tested in integration tests (test/integration/test-zstd.ts)
		// because it requires the actual fzstd library and real compressed data from docs.rs

		it("should respect abort signal", async () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			const controller = new AbortController()

			mockFetchResponses.set(url, {
				error: new Error("The operation was aborted")
			})

			// Abort immediately
			controller.abort()

			await expect(
				fetcher.fetchCrateJson("test_crate", undefined, undefined, undefined, controller.signal)
			).rejects.toThrow()
		})

		it("should handle different versions", async () => {
			const url1 = "https://docs.rs/crate/test_crate/1.0.0/json"
			const url2 = "https://docs.rs/crate/test_crate/2.0.0/json"

			const v1Data = { ...mockRustdocJson, crate: { name: "test_crate", version: "1.0.0" } }
			const v2Data = { ...mockRustdocJson, crate: { name: "test_crate", version: "2.0.0" } }

			mockFetchResponses.set(url1, { json: v1Data })
			mockFetchResponses.set(url2, { json: v2Data })

			const result1 = await fetcher.fetchCrateJson("test_crate", "1.0.0")
			const result2 = await fetcher.fetchCrateJson("test_crate", "2.0.0")

			expect(result1.data.crate.version).toBe("1.0.0")
			expect(result2.data.crate.version).toBe("2.0.0")
		})
	})

	describe("cache behavior", () => {
		it("should clear cache", async () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			mockFetchResponses.set(url, { json: mockRustdocJson })

			// Fetch and cache
			await fetcher.fetchCrateJson("test_crate")

			// Clear cache
			fetcher.clearCache()

			// Next fetch should not be from cache
			const result = await fetcher.fetchCrateJson("test_crate")
			expect(result.fromCache).toBe(false)
			expect(mockFetch).toHaveBeenCalledTimes(2)
		})
	})
})
