import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { lookupCratePrompt } from "./lookup-crate.ts"
import { lookupItemPrompt } from "./lookup-item.ts"
import { searchCratesPrompt } from "./search-crates.ts"

const registerPrompts = (server: McpServer) => {
	for (const prompt of [
		lookupCratePrompt,
		lookupItemPrompt,
		searchCratesPrompt
	]) {
		server.registerPrompt(
			prompt.name,
			{
				argsSchema: prompt.argsSchema,
				description: prompt.description
			},
			prompt.handler
		)
	}
}

export { registerPrompts }
