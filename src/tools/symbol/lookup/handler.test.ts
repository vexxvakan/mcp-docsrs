import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createLookupSymbolHandler } from "./handler.ts"

const symbolOverview = {
	crateName: "demo",
	crateVersion: "1.2.3",
	formatVersion: 57,
	symbol: {
		deprecated: false,
		hasDocs: true,
		kind: "struct" as const,
		label: "Struct",
		name: "Client",
		path: "demo::runtime::Client",
		summary: "Runtime client",
		visibility: "public"
	},
	target: "x86_64-unknown-linux-gnu"
}

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
	lookupSymbol: async () => ({
		content: "Retrieved overview for struct demo::runtime::Client from demo v1.2.3.",
		fromCache: true,
		structuredContent: symbolOverview
	}),
	lookupSymbolDocs: async () => ({
		content: "Client docs",
		fromCache: true
	}),
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createLookupSymbolHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createLookupSymbolHandler", () => {
	test.each([
		[
			"success",
			createFetcher(),
			false,
			"Retrieved overview for struct demo::runtime::Client from demo v1.2.3."
		],
		[
			"missing",
			createFetcher({
				lookupSymbol: async () => null
			}),
			true,
			"Error: Item 'struct.runtime::Client' not found in crate 'demo'"
		],
		[
			"error",
			createFetcher({
				lookupSymbol: async () => Promise.reject(new Error("missing symbol"))
			}),
			true,
			"Error: missing symbol"
		]
	])("%s", async (_name, fetcher, isError, text) => {
		const result = await createLookupSymbolHandler(fetcher)({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBe(isError)
		expect(getText(result)).toBe(text)
		expect("structuredContent" in result ? result.structuredContent : undefined).toEqual(
			isError ? undefined : symbolOverview
		)
	})
})
