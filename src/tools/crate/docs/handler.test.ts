import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createCrateDocsHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	lookupCrate: async () => ({
		content: "overview",
		fromCache: true,
		structuredContent: {
			crateName: "demo",
			crateVersion: "1.2.3",
			formatVersion: 57,
			sections: [],
			summary: "Demo crate",
			target: "x86_64-unknown-linux-gnu",
			totalItems: 0
		}
	}),
	lookupCrateDocs: async () => ({
		content: "Demo crate documentation",
		fromCache: true
	}),
	lookupSymbol: async () => null,
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createCrateDocsHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createCrateDocsHandler", () => {
	test.each([
		[
			"success",
			createFetcher(),
			false,
			"Demo crate documentation"
		],
		[
			"error",
			createFetcher({
				lookupCrateDocs: async () => Promise.reject(new Error("missing docs"))
			}),
			true,
			"Error: missing docs"
		]
	])("%s", async (_name, fetcher, isError, text) => {
		const result = await createCrateDocsHandler(fetcher)({
			crateName: "demo"
		})

		expect(result.isError ?? false).toBe(isError)
		expect(getText(result)).toBe(text)
	})
})
