import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { SymbolLookupInput } from "./types.ts"

const lookupSymbolInputSchema = z.object({
	crateName: z.string().describe("Name of the Rust crate"),
	expandDocs: z
		.boolean()
		.optional()
		.default(false)
		.describe("When true, return the full documentation text instead of the preview"),
	symbolname: z.string().describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<SymbolLookupInput>

const lookupSymbolTool: ToolDefinition<typeof lookupSymbolInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust symbol documentation"
	},
	description: "Lookup documentation for a specific symbol in a Rust crate",
	inputSchema: lookupSymbolInputSchema,
	name: "lookup_symbol"
}

export { lookupSymbolInputSchema, lookupSymbolTool }
