import type { ServerConfig } from "../config/types.ts"
import { createRustdocStore } from "./fetch.ts"
import { formatCrate, lookupItem } from "./query.ts"
import type { DocsFetcher } from "./types.ts"

const createDocsFetcher = (config: ServerConfig): DocsFetcher => {
	const store = createRustdocStore(config)

	return {
		clearCache: store.clearCache,
		close: store.close,
		lookupCrate: async (input) => {
			const { data, fromCache } = await store.load(input)
			return {
				content: formatCrate(data),
				fromCache
			}
		},
		lookupSymbol: async (input) => {
			const { data, fromCache } = await store.load(input)
			const content = lookupItem(data, input.symbolPath)
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
