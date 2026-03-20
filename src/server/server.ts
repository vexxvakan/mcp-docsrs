import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { resolveConfig } from "../config/index.ts"
import type { ServerConfigInput } from "../config/types.ts"
import { createDocsFetcher } from "../docs/index.ts"
import { ErrorLogger } from "../errors.ts"
import { APP_NAME, APP_VERSION } from "../meta.ts"
import { registerPrompts } from "../prompts/index.ts"
import { registerTools } from "../tools/register.ts"
import type { RustDocsServer } from "./types.ts"

const createServer = (configInput: ServerConfigInput = {}): RustDocsServer => {
	const config = resolveConfig(configInput)
	const server = new McpServer({
		name: APP_NAME,
		version: APP_VERSION
	})
	const fetcher = createDocsFetcher(config)
	let isClosed = false

	registerTools(server, fetcher)
	registerPrompts(server)

	return {
		close: async () => {
			if (isClosed) {
				return
			}

			isClosed = true
			try {
				await server.close()
			} catch {
				ErrorLogger.logInfo("Server close skipped because transport was not connected")
			}
			fetcher.close()
		},
		config,
		server,
		start: async () => {
			await server.connect(new StdioServerTransport())
			ErrorLogger.logInfo("MCP Rust Docs Server is running", {
				config
			})
		}
	}
}

export { createServer }
