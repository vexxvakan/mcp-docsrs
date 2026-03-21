import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { crateDocsPrompt } from "./library/crate/docs.ts"
import { crateFindPrompt } from "./library/crate/find.ts"
import { crateLookupPrompt } from "./library/crate/lookup.ts"
import { lookupSymbolPrompt } from "./library/symbol/lookup.ts"
import type { PromptArgsSchema, PromptDefinition } from "./types.ts"

const registerPrompt = <Name extends string, ArgsSchema extends PromptArgsSchema>(
	server: McpServer,
	prompt: PromptDefinition<Name, ArgsSchema>
) => {
	server.registerPrompt(
		prompt.name,
		{
			argsSchema: prompt.argsSchema,
			description: prompt.description
		},
		prompt.handler
	)
}

const registerPrompts = (server: McpServer) => {
	registerPrompt(server, crateLookupPrompt)
	registerPrompt(server, crateDocsPrompt)
	registerPrompt(server, lookupSymbolPrompt)
	registerPrompt(server, crateFindPrompt)
}

export { registerPrompts }
