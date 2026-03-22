import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createCrateDocsHandler } from "./crate/docs/handler.ts"
import { crateDocsTool } from "./crate/docs/schema.ts"
import { createCrateFindHandler } from "./crate/find/handler.ts"
import { crateFindTool } from "./crate/find/schema.ts"
import { createCrateLookupHandler } from "./crate/lookup/handler.ts"
import { crateLookupTool } from "./crate/lookup/schema.ts"
import { createSymbolDocsHandler } from "./symbol/docs/handler.ts"
import { symbolDocsTool } from "./symbol/docs/schema.ts"
import { createLookupSymbolHandler } from "./symbol/lookup/handler.ts"
import { lookupSymbolTool } from "./symbol/lookup/schema.ts"

const registerTools = (server: McpServer, fetcher: DocsFetcher) => {
	server.registerTool(
		crateLookupTool.name,
		{
			annotations: crateLookupTool.annotations,
			description: crateLookupTool.description,
			inputSchema: crateLookupTool.inputSchema,
			outputSchema: crateLookupTool.outputSchema
		},
		createCrateLookupHandler(fetcher)
	)

	server.registerTool(
		lookupSymbolTool.name,
		{
			annotations: lookupSymbolTool.annotations,
			description: lookupSymbolTool.description,
			inputSchema: lookupSymbolTool.inputSchema,
			outputSchema: lookupSymbolTool.outputSchema
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
		symbolDocsTool.name,
		{
			annotations: symbolDocsTool.annotations,
			description: symbolDocsTool.description,
			inputSchema: symbolDocsTool.inputSchema
		},
		createSymbolDocsHandler(fetcher)
	)

	server.registerTool(
		crateFindTool.name,
		{
			annotations: crateFindTool.annotations,
			description: crateFindTool.description,
			inputSchema: crateFindTool.inputSchema,
			outputSchema: crateFindTool.outputSchema
		},
		createCrateFindHandler()
	)
}

export { registerTools }
