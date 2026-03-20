import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ServerConfig } from "../config/types.ts"
import type { DocsFetcher } from "../docs/types.ts"

type ResourceContext = {
	config: ServerConfig
	fetcher: DocsFetcher
	server: McpServer
}

export type { ResourceContext }
