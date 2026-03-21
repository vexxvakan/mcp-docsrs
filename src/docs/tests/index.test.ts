import { describe, expect, test } from "bun:test"
import { createDocsFetcher } from "../index.ts"
import { createConfig } from "./fixtures.ts"

describe("createDocsFetcher", () => {
	test("creates service", () => {
		const fetcher = createDocsFetcher(createConfig())

		try {
			expect(fetcher).toHaveProperty("lookupCrate")
			expect(fetcher).toHaveProperty("lookupSymbol")
			expect(fetcher).toHaveProperty("clearCache")
			expect(fetcher).toHaveProperty("close")
		} finally {
			fetcher.close()
		}
	})
})
