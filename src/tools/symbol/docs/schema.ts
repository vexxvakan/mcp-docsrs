import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { SymbolDocsInput } from "./types.ts"

const symbolDocsInputSchema = z.object({
	crateName: z.string().describe("Name of the Rust crate"),
	symbolname: z.string().describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<SymbolDocsInput>

const symbolDocsTool: ToolDefinition<typeof symbolDocsInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Symbol Docs"
	},
	description: "Lookup full documentation for a specific symbol in a Rust crate",
	inputSchema: symbolDocsInputSchema,
	name: "symbol_docs"
}

export { symbolDocsInputSchema, symbolDocsTool }
