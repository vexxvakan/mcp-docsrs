import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createCrateDocsPromptHandler } from "./crate/docs/handler.ts"
import { crateDocsPrompt } from "./crate/docs/schema.ts"
import { createCrateFindPromptHandler } from "./crate/find/handler.ts"
import { crateFindPrompt } from "./crate/find/schema.ts"
import { createCrateLookupPromptHandler } from "./crate/lookup/handler.ts"
import { crateLookupPrompt } from "./crate/lookup/schema.ts"
import { createSymbolDocsPromptHandler } from "./symbol/docs/handler.ts"
import { symbolDocsPrompt } from "./symbol/docs/schema.ts"
import { createLookupSymbolPromptHandler } from "./symbol/lookup/handler.ts"
import { lookupSymbolPrompt } from "./symbol/lookup/schema.ts"

const registerPrompts = (server: McpServer) => {
	server.registerPrompt(
		crateLookupPrompt.name,
		{
			argsSchema: crateLookupPrompt.argsSchema,
			description: crateLookupPrompt.description
		},
		createCrateLookupPromptHandler()
	)

	server.registerPrompt(
		lookupSymbolPrompt.name,
		{
			argsSchema: lookupSymbolPrompt.argsSchema,
			description: lookupSymbolPrompt.description
		},
		createLookupSymbolPromptHandler()
	)

	server.registerPrompt(
		crateDocsPrompt.name,
		{
			argsSchema: crateDocsPrompt.argsSchema,
			description: crateDocsPrompt.description
		},
		createCrateDocsPromptHandler()
	)

	server.registerPrompt(
		symbolDocsPrompt.name,
		{
			argsSchema: symbolDocsPrompt.argsSchema,
			description: symbolDocsPrompt.description
		},
		createSymbolDocsPromptHandler()
	)

	server.registerPrompt(
		crateFindPrompt.name,
		{
			argsSchema: crateFindPrompt.argsSchema,
			description: crateFindPrompt.description
		},
		createCrateFindPromptHandler()
	)
}

export { registerPrompts }
