import { resolveConfig } from "@mcp-docsrs/config/index.ts"
import type { ServerConfigInput } from "@mcp-docsrs/config/types.ts"
import { createDocsFetcher } from "@mcp-docsrs/docs/index.ts"
import { ErrorLogger, ShutdownError, StartupError, tryAsync } from "@mcp-docsrs/errors.ts"
import { APP_NAME, APP_VERSION } from "@mcp-docsrs/meta.ts"
import { registerPrompts } from "@mcp-docsrs/prompts/register.ts"
import { registerTools } from "@mcp-docsrs/tools/register.ts"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { okAsync } from "neverthrow"
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
		close: () => {
			if (isClosed) {
				return okAsync(undefined)
			}

			return tryAsync(
				async () => {
					isClosed = true
					try {
						await server.close()
					} catch {
						ErrorLogger.logInfo("Server close skipped because transport was not connected")
					}
					fetcher.close()
				},
				(error) => new ShutdownError("close the server", error)
			)
		},
		config,
		server,
		start: () =>
			tryAsync(
				async () => {
					await server.connect(new StdioServerTransport())
					ErrorLogger.logInfo("MCP Rust Docs Server is running", {
						config
					})
				},
				(error) => new StartupError("start the server", error)
			)
	}
}

export { createServer }
