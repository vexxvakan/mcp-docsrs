import { resolveConfig } from "@mcp-docsrs/config/index.ts"
import type { ServerConfigInput } from "@mcp-docsrs/config/types.ts"
import { createDocsFetcher } from "@mcp-docsrs/docs/index.ts"
import { ErrorLogger, ShutdownError, StartupError, tryAsync } from "@mcp-docsrs/errors"
import { APP_NAME, APP_VERSION } from "@mcp-docsrs/meta.ts"
import { registerPrompts } from "@mcp-docsrs/prompts/register.ts"
import { registerTools } from "@mcp-docsrs/tools/register.ts"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import type { RustDocsServer } from "./types.ts"

type ServerDeps = {
	createFetcher?: typeof createDocsFetcher
	fetcher?: ReturnType<typeof createDocsFetcher>
}

const closeServer = async (
	server: McpServer,
	fetcher: {
		close: () => void
	},
	state: {
		isClosed: boolean
	}
) => {
	if (state.isClosed) {
		return
	}

	state.isClosed = true
	try {
		await server.close()
	} catch {
		ErrorLogger.logInfo("Server close skipped because transport was not connected")
	}
	fetcher.close()
}

const startServer = async (server: McpServer, config: ReturnType<typeof resolveConfig>) => {
	await server.connect(new StdioServerTransport())
	ErrorLogger.logInfo("MCP Rust Docs Server is running", {
		config
	})
}

const createServer = (
	configInput: ServerConfigInput = {},
	deps: ServerDeps = {}
): RustDocsServer => {
	const config = resolveConfig(configInput)
	const server = new McpServer({
		name: APP_NAME,
		version: APP_VERSION
	})
	const fetcher = deps.fetcher ?? (deps.createFetcher ?? createDocsFetcher)(config)
	const state = {
		isClosed: false
	}

	registerTools(server, fetcher)
	registerPrompts(server)

	return {
		close: () =>
			tryAsync(
				() => closeServer(server, fetcher, state),
				(error) => new ShutdownError("close the server", error)
			),
		config,
		server,
		start: () =>
			tryAsync(
				() => startServer(server, config),
				(error) => new StartupError("start the server", error)
			)
	}
}

export { closeServer, createServer, startServer }
