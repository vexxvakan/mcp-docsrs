import { decompress } from "fzstd"
import { createCache } from "../cache/index.ts"
import type { ServerConfig } from "../config/types.ts"
import {
	CrateNotFoundError,
	DecompressionError,
	ErrorLogger,
	JsonParseError,
	NetworkError,
	TimeoutError
} from "../errors.ts"
import { APP_USER_AGENT } from "../meta.ts"
import type { RustdocJson } from "../rustdoc/types.ts"
import type { DocsFetcher, DocsFetchResult } from "./types.ts"

const ACCEPT_ENCODING = "gzip, deflate, br"
const HTTP_NOT_FOUND = 404
const MEMORY_DB = ":memory:"

const buildJsonUrl = (
	crateName: string,
	version?: string,
	target?: string,
	formatVersion?: number
) =>
	[
		"https://docs.rs/crate",
		crateName,
		version ?? "latest",
		target,
		"json",
		formatVersion?.toString()
	]
		.filter(Boolean)
		.join("/")

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

	try {
		return await fetch(url, {
			headers: {
				"Accept-Encoding": ACCEPT_ENCODING,
				"User-Agent": APP_USER_AGENT
			},
			signal: controller.signal
		})
	} finally {
		clearTimeout(timeoutId)
	}
}

const parseJsonText = <T>(rawText: string, url: string) => {
	try {
		return JSON.parse(rawText) as T
	} catch (error) {
		throw new JsonParseError(rawText, error as Error, url)
	}
}

const readCompressedJson = async (response: Response, url: string) => {
	try {
		const buffer = await response.arrayBuffer()
		const decoded = new TextDecoder().decode(decompress(new Uint8Array(buffer)))
		return parseJsonText<RustdocJson>(decoded, url)
	} catch (error) {
		if (error instanceof JsonParseError) {
			throw error
		}

		throw new DecompressionError(url, "zstd", (error as Error).message)
	}
}

const readPlainJson = async (response: Response, url: string) => {
	const text = await response.text()
	if (text.trim().length === 0) {
		throw new JsonParseError("", new Error("Empty response body"), url)
	}

	return parseJsonText<RustdocJson>(text, url)
}

const readRustdocJson = (response: Response, url: string) => {
	const encoding = response.headers.get("content-encoding")?.toLowerCase()
	return encoding === "zstd" ? readCompressedJson(response, url) : readPlainJson(response, url)
}

const ensureRustdocPayload = (payload: RustdocJson, url: string) => {
	if (!(payload.root && payload.index)) {
		throw new JsonParseError(JSON.stringify(payload), new Error("Invalid rustdoc payload"), url)
	}

	return payload
}

const getCachedResult = (
	cache: ReturnType<typeof createCache<RustdocJson>>,
	url: string
): DocsFetchResult | undefined => {
	const cached = cache.getWithMetadata(url)
	return cached.data
		? {
				data: cached.data,
				fromCache: true
			}
		: undefined
}

const readRemoteCrateJson = async (input: {
	cache: ReturnType<typeof createCache<RustdocJson>>
	config: ServerConfig
	crateName: string
	url: string
	version?: string
}): Promise<DocsFetchResult> => {
	const response = await fetchWithTimeout(input.url, input.config.requestTimeout)
	if (response.status === HTTP_NOT_FOUND) {
		throw new CrateNotFoundError(input.crateName, input.version)
	}
	if (!response.ok) {
		throw new NetworkError(input.url, response.status, response.statusText)
	}

	const payload = ensureRustdocPayload(await readRustdocJson(response, input.url), input.url)
	input.cache.set(input.url, payload, input.config.cacheTtl)
	return {
		data: payload,
		fromCache: false
	}
}

const rethrowFetchError = (error: unknown, url: string, timeoutMs: number): never => {
	ErrorLogger.log(error)
	if (error instanceof CrateNotFoundError) {
		throw error
	}
	if (error instanceof NetworkError || error instanceof JsonParseError) {
		throw error
	}
	if (error instanceof DecompressionError || error instanceof TimeoutError) {
		throw error
	}
	if (error instanceof Error && error.name === "AbortError") {
		throw new TimeoutError(url, timeoutMs)
	}

	throw new NetworkError(url, undefined, undefined, (error as Error).message)
}

const createDocsFetcher = (config: ServerConfig): DocsFetcher => {
	const cache = createCache<RustdocJson>(config.maxCacheSize, config.dbPath ?? MEMORY_DB)

	const fetchCrateJson = async (
		crateName: string,
		version?: string,
		target?: string,
		formatVersion?: number
	): Promise<DocsFetchResult> => {
		const url = buildJsonUrl(crateName, version, target, formatVersion)
		const cached = getCachedResult(cache, url)
		if (cached) {
			return cached
		}

		try {
			return await readRemoteCrateJson({
				cache,
				config,
				crateName,
				url,
				version
			})
		} catch (error) {
			return rethrowFetchError(error, url, config.requestTimeout)
		}
	}

	return {
		clearCache: () => cache.clear(),
		close: () => cache.close(),
		fetchCrateJson
	}
}

export { createDocsFetcher }
