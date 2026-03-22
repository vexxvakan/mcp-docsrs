import { describe, expect, test } from "bun:test"
import { createConfig, createQueryJson } from "../../../tests/fixtures/docs.ts"
import { mockRustdocFetch } from "../../../tests/mocks/fetch.ts"
import { createDocsFetcher } from "../index.ts"

describe("createDocsFetcher", () => {
	test("creates service", () => {
		const fetcher = createDocsFetcher(createConfig())

		try {
			expect(fetcher).toHaveProperty("load")
			expect(fetcher).toHaveProperty("clearCache")
			expect(fetcher).toHaveProperty("close")
		} finally {
			fetcher.close()
		}
	})

	test("loads and caches rustdoc documents", async () => {
		const fetchSpy = await mockRustdocFetch(createQueryJson())
		const fetcher = createDocsFetcher(createConfig())

		try {
			const first = await fetcher.load({
				crateName: "demo"
			})
			const second = await fetcher.load({
				crateName: "demo"
			})

			expect(fetchSpy).toHaveBeenCalledTimes(1)
			expect(first.fromCache).toBeFalse()
			expect(first.data.crate_version).toBe("1.2.3")
			expect(second.fromCache).toBeTrue()
			expect(second.data.root).toBe(first.data.root)
		} finally {
			fetcher.clearCache()
			fetcher.close()
		}
	})
})
