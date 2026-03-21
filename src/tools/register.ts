import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { DocsFetcher } from "../docs/types.ts"
import { crateDocsTool, createCrateDocsHandler } from "./crate/docs.ts"
import { crateLookupTool, createCrateLookupHandler } from "./crate/lookup.ts"
import { createLookupSymbolHandler, lookupSymbolTool } from "./lookup-symbol.ts"
import { crateFindTool, createSearchCratesHandler } from "./search-crates.ts"

const registerTools = (server: McpServer, fetcher: DocsFetcher) => {
	server.registerTool(
		crateLookupTool.name,
		{
			annotations: crateLookupTool.annotations,
			description: crateLookupTool.description,
			inputSchema: crateLookupTool.inputSchema
		},
		createCrateLookupHandler(fetcher)
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
		crateDocsTool.name,
		{
			annotations: crateDocsTool.annotations,
			description: crateDocsTool.description,
			inputSchema: crateDocsTool.inputSchema
		},
		createCrateDocsHandler(fetcher)
	)

	server.registerTool(
		crateFindTool.name,
		{
			annotations: crateFindTool.annotations,
			description: crateFindTool.description,
			inputSchema: crateFindTool.inputSchema
		},
		createSearchCratesHandler()
	)
}

export { registerTools }
