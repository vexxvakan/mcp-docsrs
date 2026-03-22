import { type ZodType, z } from "zod"
import type { PromptDefinition } from "../../types.ts"
import type { SymbolLookupPromptArgs } from "./types.ts"

const lookupSymbolPromptArgsSchema = z.object({
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
}) satisfies ZodType<SymbolLookupPromptArgs>

const lookupSymbolPrompt: PromptDefinition<typeof lookupSymbolPromptArgsSchema.shape> = {
	argsSchema: lookupSymbolPromptArgsSchema.shape,
	description: "Inspect a specific Rust symbol from a crate",
	name: "lookup_symbol"
}

export { lookupSymbolPrompt, lookupSymbolPromptArgsSchema }
