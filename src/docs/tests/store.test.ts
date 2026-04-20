import { describe, expect, spyOn, test } from "bun:test"
import { CrateNotFoundError, NetworkError, TimeoutError } from "@mcp-docsrs/errors"
import { createConfig, createStoreJson, toResponse } from "../../../tests/fixtures/docs.ts"
import { createCacheEntry, createCacheStoreMock } from "../../../tests/mocks/cache.ts"
import { APP_USER_AGENT } from "../../meta.ts"
import { buildJsonUrl, getCachedDocument, getRemoteDocument } from "../store.ts"

const DEFAULT_CACHE_TTL = 60_000
const TEST_URL = "https://docs.rs/crate/demo/latest/json.zst"

describe("store", () => {
	describe("buildJsonUrl", () => {
		test("creates url with version target and format version", () => {
			const url = buildJsonUrl({
				crateName: "demo",
				formatVersion: 43,
				target: "x86_64-unknown-linux-gnu",
				version: "1.2.3"
			})

			expect(url).toBe("https://docs.rs/crate/demo/1.2.3/x86_64-unknown-linux-gnu/json/43.zst")
		})

		test("creates url with latest version by default", () => {
			const url = buildJsonUrl({
				crateName: "demo"
			})

			expect(url).toBe(TEST_URL)
		})
	})

	describe("getCachedDocument", () => {
		test("returns cached documents", () => {
			const data = createStoreJson()
			const cache = createCacheStoreMock(createCacheEntry(data))
			const result = getCachedDocument(cache, TEST_URL)

			expect(result).toEqual({
				data,
				fromCache: true
			})
		})

		test("returns null for cache misses", () => {
			const cache = createCacheStoreMock()
			const result = getCachedDocument(cache, TEST_URL)

			expect(result).toBeNull()
		})
	})

	describe("getRemoteDocument", () => {
		test("loads remote documents and caches parsed payload", async () => {
			const data = createStoreJson()
			const cache = createCacheStoreMock()
			const compressed = await Bun.zstdCompress(JSON.stringify(data))
			const fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async () =>
				toResponse(compressed, "zstd")) as unknown as typeof fetch)

			const result = await getRemoteDocument(
				cache,
				createConfig(),
				{
					crateName: "demo"
				},
				TEST_URL
			)

			const init = fetchSpy.mock.lastCall?.[1] as
				| (RequestInit & {
						decompress?: boolean
				  })
				| undefined

			expect(result).toEqual({
				data,
				fromCache: false
			})
			expect(fetchSpy.mock.lastCall?.[0]).toBe(TEST_URL)
			expect(init?.decompress).toBe(false)
			expect(init?.headers).toEqual({
				"Accept-Encoding": "zstd",
				"User-Agent": APP_USER_AGENT
			})
			expect(init?.signal).toBeInstanceOf(AbortSignal)
			expect(cache.set).toHaveBeenCalledWith(TEST_URL, data, DEFAULT_CACHE_TTL)
		})

		test("throws crate not found for 404 responses", async () => {
			const cache = createCacheStoreMock()
			spyOn(globalThis, "fetch").mockImplementation(
				(async () =>
					new Response(null, {
						status: 404
					})) as unknown as typeof fetch
			)

			try {
				await getRemoteDocument(
					cache,
					createConfig(),
					{
						crateName: "demo",
						version: "0.1.0"
					},
					TEST_URL
				)
				throw new Error("Expected getRemoteDocument to throw for missing crates")
			} catch (error) {
				expect(error).toBeInstanceOf(CrateNotFoundError)
			}
		})

		test("throws network errors for non-404 responses", async () => {
			const cache = createCacheStoreMock()
			spyOn(globalThis, "fetch").mockImplementation(
				(async () =>
					new Response("bad gateway", {
						status: 502,
						statusText: "Bad Gateway"
					})) as unknown as typeof fetch
			)

			try {
				await getRemoteDocument(
					cache,
					createConfig(),
					{
						crateName: "demo"
					},
					TEST_URL
				)
				throw new Error("Expected getRemoteDocument to throw for bad HTTP responses")
			} catch (error) {
				expect(error).toBeInstanceOf(NetworkError)
			}
		})

		test("throws network errors for fetch rejections", async () => {
			const cache = createCacheStoreMock()
			spyOn(globalThis, "fetch").mockImplementation((() =>
				Promise.reject(new Error("socket closed"))) as unknown as typeof fetch)

			try {
				await getRemoteDocument(
					cache,
					createConfig(),
					{
						crateName: "demo"
					},
					TEST_URL
				)
				throw new Error("Expected getRemoteDocument to throw for fetch failures")
			} catch (error) {
				expect(error).toBeInstanceOf(NetworkError)
			}
		})

		test("throws timeout errors for aborted requests", async () => {
			const cache = createCacheStoreMock()
			spyOn(globalThis, "fetch").mockImplementation(
				((_: string | URL | Request, init?: RequestInit) =>
					new Promise((_, reject) => {
						init?.signal?.addEventListener("abort", () => {
							const error = new Error("aborted")
							error.name = "AbortError"
							reject(error)
						})
					})) as unknown as typeof fetch
			)

			try {
				await getRemoteDocument(
					cache,
					createConfig(1),
					{
						crateName: "demo"
					},
					TEST_URL
				)
				throw new Error("Expected getRemoteDocument to throw for aborted requests")
			} catch (error) {
				expect(error).toBeInstanceOf(TimeoutError)
			}
		})
	})
})
