import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js"
import type { ResourceContext } from "./types.ts"

const createTextResult = (uri: URL, message: string): ReadResourceResult => ({
	contents: [
		{
			mimeType: "text/plain",
			text: message,
			uri: uri.href
		}
	]
})

const createJsonResult = (uri: URL, value: unknown): ReadResourceResult => ({
	contents: [
		{
			mimeType: "application/json",
			text: JSON.stringify(value, null, 2),
			uri: uri.href
		}
	]
})

const getSqlArg = (value: string | string[] | undefined) => {
	const sql = Array.isArray(value) ? value[0] : value
	return sql ? decodeURIComponent(sql) : ""
}

const registerCacheQueryResource = ({ server, fetcher }: ResourceContext) => {
	server.registerResource(
		"cache-query",
		new ResourceTemplate("cache://query?sql={sql}", {
			list: async () => ({
				resources: [
					{
						description: "Execute SELECT queries on the cache database",
						name: "Cache Query",
						uri: "cache://query?sql=SELECT key FROM cache LIMIT 10"
					}
				]
			})
		}),
		{
			description: "Execute SELECT queries on the cache database",
			mimeType: "application/json",
			title: "Cache Query"
		},
		(uri, args) => {
			try {
				return createJsonResult(uri, fetcher.queryCacheDb(getSqlArg(args.sql)))
			} catch (error) {
				return createTextResult(uri, `Error executing query: ${(error as Error).message}`)
			}
		}
	)
}

export { registerCacheQueryResource }
