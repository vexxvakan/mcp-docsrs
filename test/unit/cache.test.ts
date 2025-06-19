import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createCache } from "../../src/cache.js"

describe("Cache", () => {
	let cache: ReturnType<typeof createCache<any>>

	beforeEach(() => {
		cache = createCache<any>(3) // Small cache for testing
	})

	afterEach(() => {
		cache.close()
	})

	it("should store and retrieve values", () => {
		const testData = { foo: "bar", count: 42 }
		cache.set("test-key", testData, 3600000)

		const retrieved = cache.get("test-key")
		expect(retrieved).toEqual(testData)
	})

	it("should return null for non-existent keys", () => {
		const result = cache.get("non-existent")
		expect(result).toBeNull()
	})

	it("should expire entries after TTL", async () => {
		cache.set("expire-test", "value", 100) // 100ms TTL

		// Should exist immediately
		expect(cache.get("expire-test")).toBe("value")

		// Wait for expiration
		await new Promise((resolve) => setTimeout(resolve, 150))

		// Should be expired
		expect(cache.get("expire-test")).toBeNull()
	})

	it("should enforce max size", () => {
		cache.set("key1", "value1", 3600000)
		cache.set("key2", "value2", 3600000)
		cache.set("key3", "value3", 3600000)
		cache.set("key4", "value4", 3600000) // Should evict oldest

		// Oldest should be evicted
		expect(cache.get("key1")).toBeNull()

		// Others should still exist
		expect(cache.get("key2")).toBe("value2")
		expect(cache.get("key3")).toBe("value3")
		expect(cache.get("key4")).toBe("value4")
	})

	it("should clear all entries", () => {
		cache.set("key1", "value1", 3600000)
		cache.set("key2", "value2", 3600000)

		cache.clear()

		expect(cache.get("key1")).toBeNull()
		expect(cache.get("key2")).toBeNull()
	})

	it("should delete specific entries", () => {
		cache.set("key1", "value1", 3600000)
		cache.set("key2", "value2", 3600000)

		cache.delete("key1")

		expect(cache.get("key1")).toBeNull()
		expect(cache.get("key2")).toBe("value2")
	})
})
