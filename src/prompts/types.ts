import type { PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js"

type PromptArgsSchema = ZodRawShapeCompat

type PromptDefinition<Name extends string, ArgsSchema extends PromptArgsSchema> = {
	argsSchema: ArgsSchema
	description: string
	handler: PromptCallback<ArgsSchema>
	name: Name
}

export type { PromptArgsSchema, PromptDefinition }
