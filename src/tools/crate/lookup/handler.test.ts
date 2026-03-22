// biome-ignore-all lint/style/noMagicNumbers: rustdoc fixture ids intentionally mirror rustdoc item ids
// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import { createCrate, createCratesIoResponse } from "../../../../tests/fixtures/crates.ts"
import { createQueryJson } from "../../../../tests/fixtures/docs.ts"
import { mockJsonFetch } from "../../../../tests/mocks/fetch.ts"
import { createCrateLookupHandler } from "./handler.ts"

const EXTRA_PUBLIC_ITEM_IDS = [
	9,
	10,
	11,
	12,
	13,
	14,
	16,
	17,
	18,
	19,
	20,
	21
]

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	load: async () => ({
		data: createQueryJson(),
		fromCache: true
	}),
	...overrides
})

const mockSuggestions = (names: string[]) =>
	mockJsonFetch(createCratesIoResponse(names.map((name) => createCrate(name))))

const getText = (value: Awaited<ReturnType<ReturnType<typeof createCrateLookupHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createCrateLookupHandler", () => {
	test("returns structured crate overview", async () => {
		const result = await createCrateLookupHandler(createFetcher())({
			crateName: "demo"
		})

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
							name: "net",
							path: "demo::net",
							summary: "Networking tools"
						}
					],
					kind: "module",
					label: "Modules"
				},
				{
					count: 2,
					items: [
						{
							name: "Client",
							path: "demo::runtime::Client",
							summary:
								"This summary line is intentionally longer than one hundred characters so the preview formatter ha..."
						},
						{
							name: "unknown",
							path: "demo",
							summary: "Anonymous but public"
						}
					],
					kind: "struct",
					label: "Structs"
				},
				{
					count: 1,
					items: [
						{
							name: "Mode",
							path: "demo::Mode",
							summary: "Modes for the runtime"
						}
					],
					kind: "enum",
					label: "Enums"
				},
				{
					count: 1,
					items: [
						{
							name: "Handler",
							path: "demo::Handler",
							summary: "Handles requests"
						}
					],
					kind: "trait",
					label: "Traits"
				},
				{
					count: 1,
					items: [
						{
							name: "connect",
							path: "demo::connect",
							summary: "Connect to the backend"
						}
					],
					kind: "function",
					label: "Functions"
				}
			],
			summary: "Root crate docs",
			target: "x86_64-unknown-linux-gnu",
			totalItems: 6
		})
	})

	test("returns expanded rustdoc kinds in structured sections", async () => {
		const result = await createCrateLookupHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					const root = data.index["0"]
					if (typeof root.inner === "string" || !("module" in root.inner)) {
						throw new Error("Expected module root fixture")
					}

					data.index["10"].visibility = "public"
					root.inner.module.items.push(...EXTRA_PUBLIC_ITEM_IDS)
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			sections: expect.arrayContaining([
				{
					count: 2,
					items: [
						{
							name: "Alias",
							path: "demo::Alias",
							summary: "Shared alias"
						},
						{
							name: "ResultAlias",
							path: "demo::ResultAlias",
							summary: "Result alias"
						}
					],
					kind: "type_alias",
					label: "Type Aliases"
				},
				{
					count: 1,
					items: [
						{
							name: "trace",
							path: "demo::trace",
							summary: "Tracing attribute"
						}
					],
					kind: "proc_attribute",
					label: "Proc Attributes"
				}
			])
		})
	})

	test.each([
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
				load: async () => Promise.reject(new Error("missing crate"))
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
				load: async () => Promise.reject(new Error("missing crate"))
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
