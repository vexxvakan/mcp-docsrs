import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { DocsFetcher } from "../docs/types.ts"
import { crateDocsTool, createCrateDocsHandler } from "./crate/docs.ts"
import { crateFindTool, createCrateFindHandler } from "./crate/find.ts"
import { crateLookupTool, createCrateLookupHandler } from "./crate/lookup.ts"
import { createLookupSymbolHandler, lookupSymbolTool } from "./symbol/lookup.ts"

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
		createCrateFindHandler()
	)
}

export { registerTools }
