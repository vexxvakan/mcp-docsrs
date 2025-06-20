import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createDocsFetcher } from "../../src/docs-fetcher"
import { NetworkError } from "../../src/errors"
import { mockFetch, mockFetchResponses, mockRustdocJson, resetMocks } from "./mocks"

describe("DocsFetcher (Unit Tests)", () => {
	let fetcher: ReturnType<typeof createDocsFetcher>
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		// Save original fetch
		originalFetch = global.fetch
		// Mock the global fetch
		global.fetch = mockFetch as any

		resetMocks()

		// Create fetcher with in-memory cache
		fetcher = createDocsFetcher({
			cacheTtl: 3600000,
			maxCacheSize: 10
			// No dbPath means in-memory cache
		})
	})

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch
		// Close the fetcher
		fetcher.close()
	})

	describe("URL construction", () => {
		it("should construct correct URL with defaults", async () => {
			const url = "https://docs.rs/crate/tinc/latest/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("tinc")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with version", async () => {
			const url = "https://docs.rs/crate/tinc/0.1.6/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("tinc", "0.1.6")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with target", async () => {
			const url = "https://docs.rs/crate/tinc/latest/wasm32-unknown-unknown/json"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("tinc", undefined, "wasm32-unknown-unknown")
			expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object))
		})

		it("should construct URL with all parameters", async () => {
			const url = "https://docs.rs/crate/tinc/0.1.6/wasm32-unknown-unknown/json/30"
			mockFetchResponses.set(url, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: mockRustdocJson
			})

			await fetcher.fetchCrateJson("tinc", "0.1.6", "wasm32-unknown-unknown", 30)
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

		it("should handle 404 errors", () => {
			const url = "https://docs.rs/crate/nonexistent/latest/json"
			mockFetchResponses.set(url, {
				ok: false,
				status: 404,
				statusText: "Not Found"
			})

			expect(fetcher.fetchCrateJson("nonexistent")).rejects.toThrow(
				"Crate 'nonexistent' not found"
			)
		})

		it("should handle network errors", () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"
			mockFetchResponses.set(url, {
				error: new NetworkError(url, undefined, undefined, "Network error")
			})

			expect(fetcher.fetchCrateJson("test_crate")).rejects.toThrow(NetworkError)
		})

		// Note: zstd decompression is tested in integration tests (test/integration/test-zstd.ts)
		// because it requires the actual fzstd library and real compressed data from docs.rs

		it("should respect abort signal", () => {
			const url = "https://docs.rs/crate/test_crate/latest/json"

			// Create a native AbortError
			const abortError = new Error("The operation was aborted")
			abortError.name = "AbortError"

			mockFetchResponses.set(url, {
				error: abortError
			})

			expect(fetcher.fetchCrateJson("test_crate")).rejects.toThrow()
		})

		it("should handle different versions", async () => {
			const url1 = "https://docs.rs/crate/test_crate/1.0.0/json"
			const url2 = "https://docs.rs/crate/test_crate/2.0.0/json"

			mockFetchResponses.set(url1, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: { ...mockRustdocJson, version: "1.0.0" }
			})

			mockFetchResponses.set(url2, {
				ok: true,
				status: 200,
				headers: { "content-type": "application/json" },
				json: { ...mockRustdocJson, version: "2.0.0" }
			})

			const result1 = await fetcher.fetchCrateJson("test_crate", "1.0.0")
			const result2 = await fetcher.fetchCrateJson("test_crate", "2.0.0")

			expect(result1.data.version).toBe("1.0.0")
			expect(result2.data.version).toBe("2.0.0")
			expect(mockFetch).toHaveBeenCalledTimes(2)
		})
	})
})
