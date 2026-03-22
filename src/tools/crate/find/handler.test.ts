// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import { describe, expect, test } from "bun:test"
import {
	CRATES_IO_URL,
	createCrate,
	createCratesIoResponse,
	FIND_TOTAL
} from "../../../../tests/fixtures/crates.ts"
import { mockFetchReject, mockJsonFetch } from "../../../../tests/mocks/fetch.ts"
import { createCrateFindHandler } from "./handler.ts"

const getText = (value: Awaited<ReturnType<ReturnType<typeof createCrateFindHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createCrateFindHandler", () => {
	test.each([
		[
			"success",
			{
				limit: 5,
				query: "rustdoc types"
			},
			() =>
				mockJsonFetch(
					createCratesIoResponse(
						[
							createCrate("pavexc_rustdoc_types", {
								description:
									"The slimmed down schema used by pavexc to work with rustdoc's JSON output",
								downloads: 20_199,
								max_version: "0.1.80",
								recent_downloads: 132
							}),
							createCrate("rustdoc-types", {
								created_at: "2021-03-21T00:00:00.000Z",
								description: "Types for rustdoc's json output",
								downloads: 3_362_770,
								max_version: "0.57.3",
								recent_downloads: 496_894,
								repository: "https://github.com/rust-lang/rust",
								updated_at: "2026-02-28T00:00:00.000Z"
							})
						],
						FIND_TOTAL
					)
				),
			{
				isError: false,
				structuredContent: {
					crates: [
						{
							createdAt: "2021-03-21T00:00:00.000Z",
							description: "Types for rustdoc's json output",
							documentation: null,
							downloads: 3_362_770,
							homepage: null,
							maxVersion: "0.57.3",
							name: "rustdoc-types",
							recentDownloads: 496_894,
							repository: "https://github.com/rust-lang/rust",
							updatedAt: "2026-02-28T00:00:00.000Z"
						},
						{
							createdAt: null,
							description:
								"The slimmed down schema used by pavexc to work with rustdoc's JSON output",
							documentation: null,
							downloads: 20_199,
							homepage: null,
							maxVersion: "0.1.80",
							name: "pavexc_rustdoc_types",
							recentDownloads: 132,
							repository: null,
							updatedAt: null
						}
					],
					query: "rustdoc types",
					returned: 2,
					total: FIND_TOTAL
				},
				text: `Found 2 crates matching "rustdoc types" out of ${FIND_TOTAL} total.`,
				url: `${CRATES_IO_URL}?q=rustdoc%20types&per_page=50`
			}
		],
		[
			"abort",
			{
				query: "rustdoc"
			},
			() => {
				const error = new Error("aborted")
				error.name = "AbortError"
				return mockFetchReject(error)
			},
			{
				isError: true,
				text: "Error finding crates: Request timed out while searching crates.io",
				url: `${CRATES_IO_URL}?q=rustdoc&per_page=100`
			}
		],
		[
			"error",
			{
				query: "rustdoc"
			},
			() => mockFetchReject(new Error("socket closed")),
			{
				isError: true,
				text: "Error finding crates: socket closed",
				url: `${CRATES_IO_URL}?q=rustdoc&per_page=100`
			}
		]
	])("%s", async (_name, args, arrange, expected) => {
		const fetchSpy = arrange()
		const result = await createCrateFindHandler()(args)

		expect(result.isError ?? false).toBe(expected.isError)
		expect(getText(result)).toContain(expected.text)
		expect(fetchSpy.mock.lastCall?.[0]).toBe(expected.url)
		if (expected.isError) {
			expect(result.structuredContent).toBeUndefined()
			return
		}

		expect(result.structuredContent).toEqual(
			"structuredContent" in expected ? expected.structuredContent : undefined
		)
	})
})
