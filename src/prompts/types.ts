import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js"
import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js"

type PromptDefinition<ArgsSchema extends ZodRawShapeCompat> = {
	argsSchema: ArgsSchema
	description: string
	name: string
}

type PromptHandler<Args> = (args: Args) => GetPromptResult | Promise<GetPromptResult>

export type { PromptDefinition, PromptHandler }
