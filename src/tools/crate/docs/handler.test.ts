import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../../tests/fixtures/docs.ts"
import type { DocsFetcher } from "../../../docs/types.ts"
import { createCrateDocsHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	load: async () => ({
		data: createQueryJson(),
		fromCache: true
	}),
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
			"Root crate docs"
		],
		[
			"missing-docs",
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.index["0"] = {
						...data.index["0"],
						docs: null
					}
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			}),
			false,
			"No crate-level documentation available."
		],
		[
			"error",
			createFetcher({
				load: async () => Promise.reject(new Error("missing docs"))
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
