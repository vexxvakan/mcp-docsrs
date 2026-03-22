// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture objects use upstream snake_case keys
import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import { createQueryJson } from "../../../../tests/fixtures/docs.ts"
import { createSymbolDocsHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	load: async () => ({
		data: createQueryJson(),
		fromCache: true
	}),
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createSymbolDocsHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createSymbolDocsHandler", () => {
	test("returns full symbol docs", async () => {
		const result = await createSymbolDocsHandler(createFetcher())({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(getText(result)).toContain("This summary line is intentionally longer")
		expect(getText(result)).toContain("Extra details stay in the full item view.")
	})

	test("returns missing docs fallback for undocumented symbols", async () => {
		const result = await createSymbolDocsHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.index["22"] = {
						attrs: [],
						crate_id: 0,
						deprecation: null,
						docs: null,
						id: 22,
						inner: {
							struct: {
								generics: {
									params: [],
									where_predicates: []
								},
								impls: [],
								kind: "unit"
							}
						},
						links: {},
						name: "Undocumented",
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
			symbolname: "Undocumented",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(getText(result)).toBe("No symbol documentation available.")
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
			"error",
			createFetcher({
				load: async () => Promise.reject(new Error("missing docs"))
			}),
			{
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "struct"
			},
			"Error: missing docs"
		]
	])("%s", async (_name, fetcher, args, text) => {
		const result = await createSymbolDocsHandler(fetcher)(args)

		expect(result.isError ?? false).toBeTrue()
		expect(getText(result)).toBe(text)
	})
})
