import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { DocsFetcher } from "../docs/types.ts"
import { createLookupCrateHandler, lookupCrateTool } from "./lookup-crate.ts"
import { createLookupSymbolHandler, lookupSymbolTool } from "./lookup-symbol.ts"
import { createSearchCratesHandler, searchCratesTool } from "./search-crates.ts"

const registerTools = (server: McpServer, fetcher: DocsFetcher) => {
	server.registerTool(
		lookupCrateTool.name,
		{
			annotations: lookupCrateTool.annotations,
			description: lookupCrateTool.description,
			inputSchema: lookupCrateTool.inputSchema
		},
		createLookupCrateHandler(fetcher)
	)

	server.registerTool(
		lookupSymbolTool.name,
		{
			annotations: lookupSymbolTool.annotations,
			description: lookupSymbolTool.description,
			inputSchema: lookupSymbolTool.inputSchema
		},
		createLookupSymbolHandler(fetcher)
	)

	server.registerTool(
		searchCratesTool.name,
		{
			annotations: searchCratesTool.annotations,
			description: searchCratesTool.description,
			inputSchema: searchCratesTool.inputSchema
		},
		createSearchCratesHandler()
	)
}

export { registerTools }
