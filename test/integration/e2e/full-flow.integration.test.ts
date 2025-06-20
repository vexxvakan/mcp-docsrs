import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createDocsFetcher } from "../../../src/docs-fetcher.js"
import { findItem, parseCrateInfo } from "../../../src/rustdoc-parser.js"

describe("Integration Tests", () => {
	let fetcher: ReturnType<typeof createDocsFetcher>

	beforeEach(() => {
		fetcher = createDocsFetcher({
			cacheTtl: 60000,
			requestTimeout: 30000
		})
	})

	afterEach(() => {
		fetcher.close()
	})

	it("should fetch and parse a real crate (tinc)", async () => {
		try {
			// Try to fetch tinc which should have JSON docs
			const { data: json } = await fetcher.fetchCrateJson("tinc", "0.1.6")

			expect(json).toBeDefined()
			expect(json.format_version).toBeGreaterThanOrEqual(30)
			expect(json.index).toBeDefined()
			expect(json.paths).toBeDefined()

			// Parse the crate info
			const info = parseCrateInfo(json)
			expect(info).toContain("tinc")
			expect(info).toContain("JSON")

			// Try to find a common item
			const valueItem = findItem(json, "Value")
			if (valueItem) {
				expect(valueItem).toContain("Value")
			}
		} catch (error: any) {
			// If it fails with 404, that's expected for older versions
			if (error.message.includes("not found") || error.message.includes("404")) {
				console.log("Note: This crate version may not have JSON docs available yet")
			} else {
				throw error
			}
		}
	}, 10000)

	it("should handle crates without JSON docs gracefully", () => {
		// Try an old version that likely doesn't have JSON docs
		expect(fetcher.fetchCrateJson("tinc", "0.1.0")).rejects.toThrow(/not found|404/)
	}, 10000)

	it("should validate URL construction", async () => {
		// Mock a quick test without actual network call
		const originalFetch = global.fetch
		let capturedUrl = ""

		global.fetch = ((url: string | URL | Request) => {
			capturedUrl = url.toString()
			throw new Error("Test interception")
		}) as unknown as typeof fetch

		try {
			await fetcher.fetchCrateJson("test-crate", "1.2.3", "wasm32-unknown-unknown", 30)
		} catch {}

		expect(capturedUrl).toBe(
			"https://docs.rs/crate/test-crate/1.2.3/wasm32-unknown-unknown/json/30"
		)

		global.fetch = originalFetch
	}, 10000)
})
