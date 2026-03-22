import { describe, expect, test } from "bun:test"
import { createConfig, createQueryJson } from "../../../tests/fixtures/docs.ts"
import { mockRustdocFetch } from "../../../tests/mocks/fetch.ts"
import { createDocsFetcher } from "../index.ts"

describe("createDocsFetcher", () => {
	test("creates service", () => {
		const fetcher = createDocsFetcher(createConfig())

		try {
			expect(fetcher).toHaveProperty("lookupCrate")
			expect(fetcher).toHaveProperty("lookupCrateDocs")
			expect(fetcher).toHaveProperty("lookupSymbol")
			expect(fetcher).toHaveProperty("lookupSymbolDocs")
			expect(fetcher).toHaveProperty("clearCache")
			expect(fetcher).toHaveProperty("close")
		} finally {
			fetcher.close()
		}
	})

	test("loads overview, docs, and symbols", async () => {
		const fetchSpy = await mockRustdocFetch(createQueryJson())
		const fetcher = createDocsFetcher(createConfig())

		try {
			const overview = await fetcher.lookupCrate({
				crateName: "demo"
			})
			const docs = await fetcher.lookupCrateDocs({
				crateName: "demo"
			})
			const symbol = await fetcher.lookupSymbol({
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "struct"
			})
			const symbolDocs = await fetcher.lookupSymbolDocs({
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "struct"
			})

			expect(fetchSpy).toHaveBeenCalledTimes(1)
			expect(overview.fromCache).toBeFalse()
			expect(overview.content).toBe("Retrieved overview for demo v1.2.3.")
			expect(overview.structuredContent.crateName).toBe("demo")
			expect(docs.content).toBe("Root crate docs")
			expect(docs.fromCache).toBeTrue()
			expect(symbol?.content).toBe(
				"Retrieved overview for struct demo::runtime::Client from demo v1.2.3."
			)
			expect(symbol?.structuredContent.symbol.kind).toBe("struct")
			expect(symbol?.structuredContent.symbol.path).toBe("demo::runtime::Client")
			expect(symbol?.fromCache).toBeTrue()
			expect(symbolDocs?.content).toContain("This summary line is intentionally longer")
			expect(symbolDocs?.fromCache).toBeTrue()
		} finally {
			fetcher.clearCache()
			fetcher.close()
		}
	})
})
