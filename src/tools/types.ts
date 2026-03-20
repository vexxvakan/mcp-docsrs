import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js"
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js"
import type { ZodDefault, ZodNumber, ZodOptional, ZodString } from "zod"

type LookupCrateArgs = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type LookupSymbolArgs = {
	crateName: string
	symbolPath: string
	target?: string
	version?: string
}

type SearchCratesArgs = {
	limit?: number
	query: string
}

type ToolInputSchema = ZodRawShapeCompat

type ToolDefinition<Name extends string, InputSchema extends ToolInputSchema> = {
	annotations: ToolAnnotations
	description: string
	inputSchema: InputSchema
	name: Name
}

type LookupCrateInputSchema = {
	crateName: ZodString
	formatVersion: ZodOptional<ZodNumber>
	target: ZodOptional<ZodString>
	version: ZodOptional<ZodString>
}

type LookupSymbolInputSchema = {
	crateName: ZodString
	symbolPath: ZodString
	target: ZodOptional<ZodString>
	version: ZodOptional<ZodString>
}

type SearchCratesInputSchema = {
	limit: ZodDefault<ZodOptional<ZodNumber>>
	query: ZodString
}

type ToolHandler<Args> = (args: Args) => Promise<CallToolResult>

export type {
	LookupCrateArgs,
	LookupCrateInputSchema,
	LookupSymbolArgs,
	LookupSymbolInputSchema,
	SearchCratesArgs,
	SearchCratesInputSchema,
	ToolDefinition,
	ToolHandler,
	ToolInputSchema
}
