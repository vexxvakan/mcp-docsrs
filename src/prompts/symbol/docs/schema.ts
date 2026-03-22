import { type ZodType, z } from "zod"
import type { PromptDefinition } from "../../types.ts"
import type { SymbolDocsPromptArgs } from "./types.ts"

const symbolDocsPromptArgsSchema = z.object({
	crateName: z.string().optional().describe("Name of the Rust crate"),
	symbolname: z
		.string()
		.optional()
		.describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.optional()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<SymbolDocsPromptArgs>

const symbolDocsPrompt: PromptDefinition<typeof symbolDocsPromptArgsSchema.shape> = {
	argsSchema: symbolDocsPromptArgsSchema.shape,
	description: "Retrieve the full docs body for a specific Rust symbol",
	name: "symbol_docs"
}

export { symbolDocsPrompt, symbolDocsPromptArgsSchema }
