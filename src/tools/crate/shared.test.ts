// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import { describe, expect, test } from "bun:test"
import {
	CRATES_IO_URL,
	createCrate,
	createCratesIoResponse,
	FIND_TOTAL
} from "../../../tests/fixtures/crates.ts"
import { mockFetchReject, mockJsonFetch, mockTextFetch } from "../../../tests/mocks/fetch.ts"
import { fetchFindResponse, findSimilarCrates, loadRankedCrates } from "./shared.ts"

const BAD_GATEWAY_STATUS = 502
const MIN_LIMIT = 2
const MIN_FETCH_LIMIT = 50
const SCALED_LIMIT = 7
const SCALED_FETCH_LIMIT = 70
const MAX_LIMIT = 20
const MAX_FETCH_LIMIT = 100

describe("fetchFindResponse", () => {
	test.each([
		{
			arrange: () =>
				mockJsonFetch(
					createCratesIoResponse(
						[
							createCrate("rustdoc-types", {
								description: "Types for rustdoc's json output"
							})
						],
						FIND_TOTAL
					)
				),
			error: null,
			limit: 10,
			name: "success",
			query: "rustdoc types"
		},
		{
			arrange: () =>
				mockTextFetch(null, {
					status: BAD_GATEWAY_STATUS,
					statusText: "Bad Gateway"
				}),
			error: {
				message: `Network request failed: HTTP ${BAD_GATEWAY_STATUS} Bad Gateway`,
				name: "NetworkError"
			},
			limit: 10,
			name: "http",
			query: "rustdoc"
		},
		{
			arrange: () => mockTextFetch("{"),
			error: {
				message: "Failed to parse JSON",
				name: "SyntaxError"
			},
			limit: 10,
			name: "json",
			query: "rustdoc"
		},
		{
			arrange: () => mockFetchReject(new Error("socket closed")),
			error: {
				message: "socket closed",
				name: "Error"
			},
			limit: 10,
			name: "reject",
			query: "rustdoc"
		}
	])("$name", async ({ arrange, error, limit, query }) => {
		const fetchSpy = arrange()

		if (error === null) {
			const result = await fetchFindResponse(query, limit)
			expect(result.meta.total).toBe(FIND_TOTAL)
			expect(result.crates.map((crate) => crate.name)).toEqual([
				"rustdoc-types"
			])
		} else {
			await expect(fetchFindResponse(query, limit)).rejects.toMatchObject(error)
		}

		expect(fetchSpy.mock.lastCall?.[0]).toBe(
			`${CRATES_IO_URL}?q=${encodeURIComponent(query)}&per_page=${limit}`
		)
	})

	test("aborts requests through the timeout callback", async () => {
		const originalSetTimeout = globalThis.setTimeout
		const fetchSpy = mockJsonFetch(createCratesIoResponse([], FIND_TOTAL))

		globalThis.setTimeout = ((handler: TimerHandler, _timeout?: number) => {
			if (typeof handler === "function") {
				handler()
			}

			return 1 as never
		}) as typeof setTimeout

		try {
			const result = await fetchFindResponse("rustdoc", 10)

			expect(result.meta.total).toBe(FIND_TOTAL)
			expect(fetchSpy).toHaveBeenCalled()
		} finally {
			globalThis.setTimeout = originalSetTimeout
		}
	})
})

describe("loadRankedCrates", () => {
	test.each([
		{
			fetchLimit: MIN_FETCH_LIMIT,
			limit: MIN_LIMIT,
			name: "min"
		},
		{
			fetchLimit: SCALED_FETCH_LIMIT,
			limit: SCALED_LIMIT,
			name: "scaled"
		},
		{
			fetchLimit: MAX_FETCH_LIMIT,
			limit: MAX_LIMIT,
			name: "max"
		}
	])("$name", async ({ fetchLimit, limit }) => {
		const fetchSpy = mockJsonFetch(
			createCratesIoResponse(
				[
					createCrate("pavexc_rustdoc_types", {
						description:
							"The slimmed down schema used by pavexc to work with rustdoc's JSON output",
						downloads: 20_199,
						recent_downloads: 132
					}),
					createCrate("rustdoc-types", {
						description: "Types for rustdoc's json output",
						downloads: 3_362_770,
						recent_downloads: 496_894
					}),
					createCrate("txt", {
						description: "cargo doc for coding agents",
						downloads: 125,
						recent_downloads: 125
					})
				],
				FIND_TOTAL
			)
		)

		const result = await loadRankedCrates("rustdoc types", limit)

		expect(fetchSpy.mock.lastCall?.[0]).toBe(
			`${CRATES_IO_URL}?q=rustdoc%20types&per_page=${fetchLimit}`
		)
		expect(result.total).toBe(FIND_TOTAL)
		expect(result.ranked.map((candidate) => candidate.crate.name)).toEqual(
			[
				"rustdoc-types",
				"pavexc_rustdoc_types"
			].slice(0, limit)
		)
	})
})

describe("findSimilarCrates", () => {
	test.each([
		{
			arrange: () =>
				mockJsonFetch(
					createCratesIoResponse([
						createCrate("tokio-util", {
							description: "Tokio utilities",
							downloads: 3_000_000,
							recent_downloads: 100_000
						}),
						createCrate("tokio", {
							description: "An event-driven, non-blocking I/O platform",
							downloads: 55_000_000,
							max_version: "1.48.0",
							recent_downloads: 7_000_000
						})
					])
				),
			expected: [
				"tokio",
				"tokio-util"
			],
			name: "success"
		},
		{
			arrange: () => mockFetchReject(new Error("socket closed")),
			expected: [],
			name: "error"
		}
	])("$name", async ({ arrange, expected }) => {
		arrange()
		expect(await findSimilarCrates("tokio", 2)).toEqual([
			...expected
		])
	})
})
