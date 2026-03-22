import type { AnySchema, ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js"
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js"

type ToolDefinition<
	InputSchema extends AnySchema | ZodRawShapeCompat,
	OutputSchema extends AnySchema | ZodRawShapeCompat | undefined = undefined
> = {
	annotations: ToolAnnotations
	description: string
	inputSchema: InputSchema
	name: string
	outputSchema?: OutputSchema
}

type ToolHandler<Args> = (args: Args) => Promise<CallToolResult>

export type { ToolDefinition, ToolHandler }
