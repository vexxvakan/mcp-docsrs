import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js"
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js"

type ToolInputSchema = ZodRawShapeCompat

type ToolDefinition<Name extends string, InputSchema extends ToolInputSchema> = {
	annotations: ToolAnnotations
	description: string
	inputSchema: InputSchema
	name: Name
}

type ToolHandler<Args> = (args: Args) => Promise<CallToolResult>

export type { ToolDefinition, ToolHandler, ToolInputSchema }
