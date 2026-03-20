import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"

type LookupCrateArgs = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type LookupItemArgs = {
	crateName: string
	itemPath: string
	target?: string
	version?: string
}

type SearchCratesArgs = {
	limit?: number
	query: string
}

type ToolHandler<Args> = (args: Args) => Promise<CallToolResult>

export type { LookupCrateArgs, LookupItemArgs, SearchCratesArgs, ToolHandler }
