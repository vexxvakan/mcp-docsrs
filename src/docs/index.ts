import { createCache } from "../cache/index.ts"
import type { ServerConfig } from "../config/types.ts"
import { lookupCrate, lookupItem } from "./query.ts"
import { buildJsonUrl, getCachedDocument, getRemoteDocument } from "./store.ts"
import type { DocsFetcher, DocsLoadResult, DocsRequest } from "./types.ts"

const createDocsFetcher = (config: ServerConfig): DocsFetcher => {
	const cache = createCache(config.maxCacheSize, config.dbPath ?? ":memory:")

	const load = (input: DocsRequest): Promise<DocsLoadResult> => {
		const url = buildJsonUrl(input)
		const cached = getCachedDocument(cache, url)
		if (cached) {
			return Promise.resolve(cached)
		}

		return getRemoteDocument(cache, config, input, url)
	}

	return {
		clearCache: () => cache.clear(),
		close: () => cache.close(),
		lookupCrate: async (input) => {
			const { data, fromCache } = await load(input)
			return {
				content: lookupCrate(data),
				fromCache
			}
		},
		lookupSymbol: async (input) => {
			const { data, fromCache } = await load(input)
			const content = lookupItem(data, input)
			return content
				? {
						content,
						fromCache
					}
				: null
		}
	}
}

export { createDocsFetcher }
