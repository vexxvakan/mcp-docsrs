import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ServerConfig } from "../config/types.ts"
import type { DocsFetcher } from "../docs/types.ts"
import { registerCacheEntriesResource } from "./cache-entries.ts"
import { registerCacheQueryResource } from "./cache-query.ts"
import { registerCacheStatsResource } from "./cache-stats.ts"
import { registerServerConfigResource } from "./server-config.ts"

const registerResources = (server: McpServer, config: ServerConfig, fetcher: DocsFetcher) => {
	const context = {
		config,
		fetcher,
		server
	}

	registerCacheStatsResource(context)
	registerCacheEntriesResource(context)
	registerCacheQueryResource(context)
	registerServerConfigResource(context)
}

export { registerResources }
