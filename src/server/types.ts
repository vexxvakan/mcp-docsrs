import type { ServerConfig } from "@mcp-docsrs/config/types.ts"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

type RustDocsServer = {
	close: () => Promise<void>
	config: ServerConfig
	server: McpServer
	start: () => Promise<void>
}

export type { RustDocsServer }
