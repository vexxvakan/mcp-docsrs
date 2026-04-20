import type { ServerConfig } from "@mcp-docsrs/config/types.ts"
import type { AppResultAsync, ShutdownError, StartupError } from "@mcp-docsrs/errors"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

type RustDocsServer = {
	close: () => AppResultAsync<void, ShutdownError>
	config: ServerConfig
	server: McpServer
	start: () => AppResultAsync<void, StartupError>
}

export type { RustDocsServer }
