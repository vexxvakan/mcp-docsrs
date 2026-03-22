// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture objects use upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../../tests/fixtures/docs.ts"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createLookupSymbolHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	load: async () => ({
		data: createQueryJson(),
		fromCache: true
	}),
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createLookupSymbolHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createLookupSymbolHandler", () => {
	test("returns structured symbol overview", async () => {
		const result = await createLookupSymbolHandler(createFetcher())({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(getText(result)).toBe(
			"Retrieved overview for struct demo::runtime::Client from demo v1.2.3."
		)
		expect(result.structuredContent).toEqual({
			crateName: "demo",
			crateVersion: "1.2.3",
			formatVersion: 57,
			symbol: {
				deprecated: false,
				hasDocs: true,
				kind: "struct",
				label: "Struct",
				name: "Client",
				path: "demo::runtime::Client",
				summary:
					"This summary line is intentionally longer than one hundred characters so the preview formatter ha...",
				visibility: "public"
			},
			target: "x86_64-unknown-linux-gnu"
		})
	})

	test("falls back to short symbol paths", async () => {
		const result = await createLookupSymbolHandler(createFetcher())({
			crateName: "demo",
			symbolname: "Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			symbol: {
				kind: "struct",
				name: "Client",
				path: "demo::runtime::Client"
			}
		})
	})

	test("uses raw item kinds even when path metadata drifts", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.paths["9"] = {
						crate_id: 0,
						kind: "macro",
						path: [
							"demo",
							"Alias"
						]
					}
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo",
			symbolname: "Alias",
			symbolType: "type"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			symbol: {
				kind: "type_alias",
				label: "Type Alias",
				name: "Alias"
			}
		})
	})

	test("falls back to index matches when path metadata is missing", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.index["11"] = {
						attrs: [],
						crate_id: 0,
						deprecation: null,
						docs: null,
						id: 11,
						inner: {
							module: {
								is_crate: false,
								is_stripped: false,
								items: []
							}
						},
						links: {},
						name: "FallbackMod",
						span: null,
						visibility: "public"
					}
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo",
			symbolname: "FallbackMod",
			symbolType: "module"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			symbol: {
				kind: "module",
				name: "FallbackMod",
				visibility: "public"
			}
		})
	})

	test.each([
		[
			"missing",
			createFetcher(),
			{
				crateName: "demo",
				symbolname: "other::Ghost",
				symbolType: "struct"
			},
			"Error: Item 'struct.other::Ghost' not found in crate 'demo'"
		],
		[
			"invalid-kind",
			createFetcher(),
			{
				crateName: "demo",
				symbolname: "Client",
				symbolType: "missing"
			},
			"Error: Item 'missing.Client' not found in crate 'demo'"
		],
		[
			"error",
			createFetcher({
				load: async () => Promise.reject(new Error("missing symbol"))
			}),
			{
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "struct"
			},
			"Error: missing symbol"
		]
	])("%s", async (_name, fetcher, args, text) => {
		const result = await createLookupSymbolHandler(fetcher)(args)

		expect(result.isError ?? false).toBeTrue()
		expect(getText(result)).toBe(text)
	})
})
