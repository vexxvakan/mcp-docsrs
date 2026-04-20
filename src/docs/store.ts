import { CrateNotFoundError, NetworkError, TimeoutError } from "@mcp-docsrs/errors"
import type { CacheStore } from "../cache/types.ts"
import type { ServerConfig } from "../config/types.ts"
import { APP_USER_AGENT } from "../meta.ts"
import { parseRustdoc } from "./parse.ts"
import type { DocsLoadResult, DocsRequest } from "./types.ts"

const HTTP_NOT_FOUND = 404

const buildJsonUrl = (input: DocsRequest) => {
	let url = `https://docs.rs/crate/${encodeURIComponent(input.crateName)}/${encodeURIComponent(input.version ?? "latest")}`
	if (input.target) {
		url += `/${encodeURIComponent(input.target)}`
	}
	url += "/json"
	if (input.formatVersion !== undefined) {
		url += `/${input.formatVersion}`
	}
	url += ".zst"

	return url
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

	try {
		return await fetch(url, {
			decompress: false,
			headers: {
				"Accept-Encoding": "zstd",
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

const getCachedDocument = (cache: CacheStore, url: string) => {
	const cached = cache.get(url)
	if (!cached?.data) {
		return null
	}

	return {
		data: cached.data,
		fromCache: true
	} satisfies DocsLoadResult
}

const getRemoteDocument = async (
	cache: CacheStore,
	config: ServerConfig,
	input: DocsRequest,
	url: string
): Promise<DocsLoadResult> => {
	const response = await fetchWithTimeout(url, config.requestTimeout)
	if (response.status === HTTP_NOT_FOUND) {
		throw new CrateNotFoundError(input.crateName, input.version)
	}
	if (!response.ok) {
		throw new NetworkError(url, response.status, response.statusText)
	}

	const data = await parseRustdoc(response, url)
	cache.set(url, data, config.cacheTtl)
	return {
		data,
		fromCache: false
	}
}

export { buildJsonUrl, getCachedDocument, getRemoteDocument }
