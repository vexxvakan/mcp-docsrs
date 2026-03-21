// biome-ignore-all lint/style/useNamingConvention: crates.io API fixtures use snake_case keys
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test"
import { rankCrates } from "../../../docs/classifier/rank.ts"
import { formatCrateFindResults } from "../../../docs/formatters/crate.ts"
import { createCrateFindHandler, fetchFindResponse, findSimilarCrates } from "../find.ts"
import { fetchCases } from "./cases/find/fetch.ts"
import { formatCases } from "./cases/find/format.ts"
import { handlerCases } from "./cases/find/handler.ts"
import { rankCases } from "./cases/find/rank.ts"
import { similarCases } from "./cases/find/similar.ts"
import { CRATES_IO_URL } from "./cases/shared.ts"
import type {
	FetchCase,
	FetchResponseCase,
	FormatCase,
	HandlerCase,
	RankCase,
	SimilarCase
} from "./types.ts"

const applyFetchResponse = (response: FetchResponseCase) => {
	switch (response.kind) {
		case "success":
			return spyOn(globalThis, "fetch").mockImplementation((() =>
				Promise.resolve(
					new Response(JSON.stringify(response.body), {
						status: 200
					})
				)) as unknown as typeof fetch)
		case "http_error":
			return spyOn(globalThis, "fetch").mockImplementation((() =>
				Promise.resolve(
					new Response(null, {
						status: response.status,
						statusText: response.statusText
					})
				)) as unknown as typeof fetch)
		case "invalid_json":
			return spyOn(globalThis, "fetch").mockImplementation((() =>
				Promise.resolve(
					new Response(response.body, {
						status: 200
					})
				)) as unknown as typeof fetch)
		case "reject":
			return spyOn(globalThis, "fetch").mockImplementation((() =>
				Promise.reject(response.error)) as unknown as typeof fetch)
		default:
			throw new Error("Unsupported fetch case")
	}
}

const captureFetchError = async (query: string, limit: number) => {
	try {
		await fetchFindResponse(query, limit)
		throw new Error("Expected fetchFindResponse to fail")
	} catch (error) {
		return error as Error
	}
}

const resolveFetchCase = async (testCase: FetchCase) => {
	if (testCase.response.kind === "success") {
		return {
			error: null,
			result: await fetchFindResponse(testCase.query, testCase.limit)
		}
	}

	return {
		error: await captureFetchError(testCase.query, testCase.limit),
		result: null
	}
}

describe("crate_find", () => {
	afterEach(() => {
		mock.restore()
		mock.clearAllMocks()
	})

	describe.each(fetchCases)("fetchFindResponse", (testCase: FetchCase) => {
		test(testCase.name, async () => {
			const fetchSpy = applyFetchResponse(testCase.response)

			try {
				await fetchFindResponse(testCase.query, testCase.limit)
			} catch {
				// Expected for throw cases.
			}

			expect(fetchSpy.mock.lastCall?.[0]).toBe(
				`${CRATES_IO_URL}?q=${encodeURIComponent(testCase.query)}&per_page=${testCase.limit}`
			)
			const resolved = await resolveFetchCase(testCase)

			if (testCase.response.kind === "success") {
				expect(resolved.result?.meta.total).toBe(testCase.response.body.meta.total)
				expect(resolved.result?.crates.map((crate) => crate.name)).toEqual(
					testCase.response.body.crates.map((crate) => crate.name)
				)
				return
			}

			expect(resolved.error).toBeInstanceOf(Error)
			if (testCase.expected.errorName) {
				expect(resolved.error?.name).toBe(testCase.expected.errorName)
			}
			if (testCase.expected.errorMessage) {
				expect(resolved.error?.message).toContain(testCase.expected.errorMessage)
			}
		})
	})

	describe.each(rankCases)("rankCrates", (testCase: RankCase) => {
		test(testCase.name, () => {
			const ranked = rankCrates(testCase.query, testCase.crates)

			expect(ranked.map((candidate) => candidate.crate.name)).toEqual(testCase.expectedNames)
			if (!testCase.expectedTier) {
				expect(ranked).toHaveLength(0)
				return
			}

			expect(ranked[0]?.scores.tier).toBe(testCase.expectedTier)
		})
	})

	describe.each(formatCases)("formatCrateFindResults", (testCase: FormatCase) => {
		test(testCase.name, () => {
			const text = formatCrateFindResults(
				testCase.query,
				testCase.total,
				testCase.crates,
				testCase.now
			)

			for (const expected of testCase.expectedIncludes) {
				expect(text).toContain(expected)
			}
			for (const excluded of testCase.expectedExcludes ?? []) {
				expect(text).not.toContain(excluded)
			}
		})
	})

	describe.each(handlerCases)("createCrateFindHandler", (testCase: HandlerCase) => {
		test(testCase.name, async () => {
			const fetchSpy = applyFetchResponse(testCase.response)
			const handler = createCrateFindHandler()
			const result = await handler(testCase.args)
			const text = result.content[0]?.type === "text" ? result.content[0].text : ""

			expect(result.isError ?? false).toBe(testCase.expected.isError)
			expect(text).toContain(testCase.expected.text)
			if (testCase.expected.url) {
				expect(fetchSpy.mock.lastCall?.[0]).toBe(testCase.expected.url)
			}
		})
	})

	describe.each(similarCases)("findSimilarCrates", (testCase: SimilarCase) => {
		test(testCase.name, async () => {
			applyFetchResponse(testCase.response)

			const result = await findSimilarCrates(testCase.query, testCase.limit)

			expect(result).toEqual(testCase.expectedNames)
		})
	})
})
