import { createCache } from "../cache/index.ts"
import type { CacheStore } from "../cache/types.ts"
import type { ServerConfig } from "../config/types.ts"
import {
	CrateNotFoundError,
	DecompressionError,
	JsonParseError,
	NetworkError,
	TimeoutError
} from "../errors.ts"
import { APP_USER_AGENT } from "../meta.ts"
import type { DocsRequest, RustdocDocument, RustdocJson } from "./types.ts"

const ACCEPT_ENCODING = "zstd"
const HTTP_NOT_FOUND = 404
const IDENTITY_ENCODING = "identity"
const MEMORY_DB = ":memory:"
const TEXT_DECODER = new TextDecoder()

const encodePathSegment = (value: string) => encodeURIComponent(value)

const buildJsonUrl = (input: DocsRequest) => {
	let url = `https://docs.rs/crate/${encodePathSegment(input.crateName)}/${encodePathSegment(input.version ?? "latest")}`
	if (input.target) {
		url += `/${encodePathSegment(input.target)}`
	}
	url += "/json"
	if (input.formatVersion !== undefined) {
		url += `/${input.formatVersion}`
	}

	return url
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

	try {
		return await fetch(url, {
			decompress: false,
			headers: {
				"Accept-Encoding": ACCEPT_ENCODING,
				"User-Agent": APP_USER_AGENT
			},
			signal: controller.signal
		})
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new TimeoutError(url, timeoutMs)
		}

		throw new NetworkError(url, undefined, undefined, (error as Error).message)
	} finally {
		clearTimeout(timeoutId)
	}
}

const decodeBytes = async (bytes: Uint8Array, encoding: string | null | undefined, url: string) => {
	if (bytes.length === 0) {
		throw new JsonParseError("", new Error("Empty response body"), url)
	}
	if (!encoding || encoding === IDENTITY_ENCODING) {
		return TEXT_DECODER.decode(bytes)
	}
	if (encoding !== "zstd") {
		throw new DecompressionError(url, encoding, "Unsupported content encoding")
	}

	try {
		return TEXT_DECODER.decode(await Bun.zstdDecompress(bytes))
	} catch (error) {
		throw new DecompressionError(url, encoding, (error as Error).message)
	}
}

const parseRustdoc = (raw: string, url: string) => {
	try {
		const payload = JSON.parse(raw) as RustdocJson
		if (!(payload.root && payload.index && payload.paths)) {
			throw new Error("Invalid rustdoc payload")
		}

		return payload
	} catch (error) {
		if (error instanceof JsonParseError) {
			throw error
		}

		throw new JsonParseError(raw, error as Error, url)
	}
}

const readRustdoc = async (response: Response, url: string) =>
	parseRustdoc(
		await decodeBytes(
			new Uint8Array(await response.arrayBuffer()),
			response.headers.get("content-encoding")?.toLowerCase(),
			url
		),
		url
	)

const getCachedDocument = (cache: CacheStore, url: string) => {
	const cached = cache.getWithMetadata<RustdocJson>(url)
	if (!cached.data) {
		return null
	}

	return {
		data: cached.data,
		fromCache: true
	} satisfies RustdocDocument
}

const readRemoteDocument = async (
	cache: CacheStore,
	config: ServerConfig,
	input: DocsRequest,
	url: string
): Promise<RustdocDocument> => {
	const response = await fetchWithTimeout(url, config.requestTimeout)
	if (response.status === HTTP_NOT_FOUND) {
		throw new CrateNotFoundError(input.crateName, input.version)
	}
	if (!response.ok) {
		throw new NetworkError(url, response.status, response.statusText)
	}

	const data = await readRustdoc(response, url)
	cache.set(url, data, config.cacheTtl)
	return {
		data,
		fromCache: false
	}
}

const createRustdocStore = (config: ServerConfig) => {
	const cache = createCache(config.maxCacheSize, config.dbPath ?? MEMORY_DB)

	const load = (input: DocsRequest): Promise<RustdocDocument> => {
		const url = buildJsonUrl(input)
		const cached = getCachedDocument(cache, url)
		if (cached) {
			return Promise.resolve(cached)
		}

		return readRemoteDocument(cache, config, input, url)
	}

	return {
		clearCache: () => cache.clear(),
		close: () => cache.close(),
		load
	}
}

export { createRustdocStore }
