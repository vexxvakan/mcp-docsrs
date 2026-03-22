import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createSymbolDocsHandler } from "./handler.ts"

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
		content: "docs",
		fromCache: true
	}),
	lookupSymbol: async () => null,
	lookupSymbolDocs: async () => ({
		content: "Client docs",
		fromCache: true
	}),
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createSymbolDocsHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createSymbolDocsHandler", () => {
	test.each([
		[
			"success",
			createFetcher(),
			false,
			"Client docs"
		],
		[
			"missing",
			createFetcher({
				lookupSymbolDocs: async () => null
			}),
			true,
			"Error: Item 'struct.runtime::Client' not found in crate 'demo'"
		],
		[
			"error",
			createFetcher({
				lookupSymbolDocs: async () => Promise.reject(new Error("missing docs"))
			}),
			true,
			"Error: missing docs"
		]
	])("%s", async (_name, fetcher, isError, text) => {
		const result = await createSymbolDocsHandler(fetcher)({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBe(isError)
		expect(getText(result)).toBe(text)
	})
})
