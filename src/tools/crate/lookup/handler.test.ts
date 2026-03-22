// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import { describe, expect, test } from "bun:test"
import { createCrate, createCratesIoResponse } from "../../../../tests/fixtures/crates.ts"
import { mockJsonFetch } from "../../../../tests/mocks/fetch.ts"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createCrateLookupHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	lookupCrate: async () => ({
		content: "Retrieved overview for demo v1.2.3.",
		fromCache: true,
		structuredContent: {
			crateName: "demo",
			crateVersion: "1.2.3",
			formatVersion: 57,
			sections: [
				{
					count: 1,
					items: [
						{
							name: "Client",
							path: "demo::runtime::Client",
							summary: "Runtime client"
						}
					],
					kind: "struct",
					label: "Structs"
				}
			],
			summary: "Demo crate",
			target: "x86_64-unknown-linux-gnu",
			totalItems: 1
		}
	}),
	lookupCrateDocs: async () => ({
		content: "docs",
		fromCache: true
	}),
	lookupSymbol: async () => null,
	lookupSymbolDocs: async () => null,
	...overrides
})

const mockSuggestions = (names: string[]) =>
	mockJsonFetch(createCratesIoResponse(names.map((name) => createCrate(name))))

const getText = (value: Awaited<ReturnType<ReturnType<typeof createCrateLookupHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createCrateLookupHandler", () => {
	test.each([
		{
			arrange: undefined,
			assertResult: (result: Awaited<ReturnType<ReturnType<typeof createCrateLookupHandler>>>) => {
				expect(result.isError ?? false).toBeFalse()
				expect(getText(result)).toContain("Retrieved overview for demo v1.2.3.")
				expect(result.structuredContent).toEqual({
					crateName: "demo",
					crateVersion: "1.2.3",
					formatVersion: 57,
					sections: [
						{
							count: 1,
							items: [
								{
									name: "Client",
									path: "demo::runtime::Client",
									summary: "Runtime client"
								}
							],
							kind: "struct",
							label: "Structs"
						}
					],
					summary: "Demo crate",
					target: "x86_64-unknown-linux-gnu",
					totalItems: 1
				})
			},
			fetcher: createFetcher(),
			name: "success"
		},
		{
			arrange: () =>
				mockSuggestions([
					"demo-core"
				]),
			assertResult: (result: Awaited<ReturnType<ReturnType<typeof createCrateLookupHandler>>>) => {
				expect(result.isError ?? false).toBeTrue()
				expect(getText(result)).toContain(
					"Error: missing crate\nDid you mean one of these crates?\n- demo-core"
				)
				expect(result.structuredContent).toBeUndefined()
			},
			fetcher: createFetcher({
				lookupCrate: async () => Promise.reject(new Error("missing crate"))
			}),
			name: "suggest"
		},
		{
			arrange: () =>
				mockSuggestions([
					"demo"
				]),
			assertResult: (result: Awaited<ReturnType<ReturnType<typeof createCrateLookupHandler>>>) => {
				expect(result.isError ?? false).toBeTrue()
				expect(getText(result)).toContain("Error: missing crate")
				expect(getText(result)).not.toContain("Did you mean one of these crates?")
				expect(result.structuredContent).toBeUndefined()
			},
			fetcher: createFetcher({
				lookupCrate: async () => Promise.reject(new Error("missing crate"))
			}),
			name: "plain"
		}
	])("$name", async ({ arrange, assertResult, fetcher }) => {
		arrange?.()
		const result = await createCrateLookupHandler(fetcher)({
			crateName: "demo"
		})

		assertResult(result)
	})
})
