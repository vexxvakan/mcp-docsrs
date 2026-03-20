import type { ResourceContext } from "./types.ts"

const createJsonResult = (uri: URL, value: unknown) => ({
	contents: [
		{
			mimeType: "application/json",
			text: JSON.stringify(value, null, 2),
			uri: uri.href
		}
	]
})

const registerCacheStatsResource = ({ server, fetcher }: ResourceContext) => {
	server.registerResource(
		"cache-stats",
		"cache://stats",
		{
			description: "Get cache statistics including total entries and size",
			mimeType: "application/json",
			title: "Cache Statistics"
		},
		async (uri) => createJsonResult(uri, fetcher.getCacheStats())
	)
}

export { registerCacheStatsResource }
