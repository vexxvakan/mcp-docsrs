import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ResourceContext } from "./types.ts"

const DEFAULT_LIMIT = 100

const createJsonResult = (uri: URL, value: unknown) => ({
	contents: [
		{
			mimeType: "application/json",
			text: JSON.stringify(value, null, 2),
			uri: uri.href
		}
	]
})

const parseNumberArg = (value: string | string[] | undefined, fallback: number) => {
	const raw = Array.isArray(value) ? value[0] : value
	if (!raw) {
		return fallback
	}

	const parsed = Number.parseInt(raw, 10)
	return Number.isNaN(parsed) ? fallback : parsed
}

const registerCacheEntriesResource = ({ server, fetcher }: ResourceContext) => {
	server.registerResource(
		"cache-entries",
		// biome-ignore lint/security/noSecrets: required MCP URI template, not a credential
		new ResourceTemplate("cache://entries?limit={limit}&offset={offset}", {
			list: async () => ({
				resources: [
					{
						description: "List cached documentation entries",
						name: "Cache Entries",
						// biome-ignore lint/security/noSecrets: required MCP URI example, not a credential
						uri: "cache://entries?limit=10&offset=0"
					}
				]
			})
		}),
		{
			description: "List cached documentation entries",
			mimeType: "application/json",
			title: "Cache Entries"
		},
		async (uri, args) =>
			createJsonResult(uri, {
				entries: fetcher.getCacheEntries(
					parseNumberArg(args.limit, DEFAULT_LIMIT),
					parseNumberArg(args.offset, 0)
				)
			})
	)
}

export { registerCacheEntriesResource }
