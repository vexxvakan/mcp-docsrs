import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ServerConfig } from "../config/types.ts"

type RustDocsServer = {
	close: () => Promise<void>
	config: ServerConfig
	server: McpServer
	start: () => Promise<void>
}

export type { RustDocsServer }
