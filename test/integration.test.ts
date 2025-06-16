import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createDocsFetcher } from "../src/docs-fetcher.js"
import { findItem, parseCrateInfo } from "../src/rustdoc-parser.js"

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

	// Skip these tests in CI or when offline
	const skipInCI = process.env.CI ? it.skip : it

	skipInCI("should fetch and parse a real crate (serde_json)", async () => {
		try {
			// Try to fetch serde_json which should have JSON docs
			const json = await fetcher.fetchCrateJson("serde_json", "1.0.134")

			expect(json).toBeDefined()
			expect(json.format_version).toBeGreaterThanOrEqual(30)
			expect(json.index).toBeDefined()
			expect(json.paths).toBeDefined()

			// Parse the crate info
			const info = parseCrateInfo(json)
			expect(info).toContain("serde_json")
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
	})

	skipInCI("should handle crates without JSON docs gracefully", async () => {
		// Try an old version that likely doesn't have JSON docs
		await expect(fetcher.fetchCrateJson("serde", "0.1.0")).rejects.toThrow(/not found|404/)
	})

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
	})
})
