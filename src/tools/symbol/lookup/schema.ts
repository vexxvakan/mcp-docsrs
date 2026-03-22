import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { SymbolLookupInput, SymbolLookupOutput } from "./types.ts"

const lookupSymbolInputSchema = z.object({
	crateName: z.string().describe("Name of the Rust crate"),
	symbolname: z.string().describe('Symbol name or path, for example "runtime::Client" or "spawn"'),
	symbolType: z
		.string()
		.describe('Rustdoc symbol type, for example "struct", "function", or "trait"'),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<SymbolLookupInput>

const lookupSymbolOutputSchema = z.object({
	crateName: z.string(),
	crateVersion: z.string().nullable(),
	formatVersion: z.number(),
	symbol: z.object({
		deprecated: z.boolean(),
		hasDocs: z.boolean(),
		kind: z.enum([
			"assoc_const",
			"assoc_type",
			"attribute",
			"constant",
			"enum",
			"extern_crate",
			"extern_type",
			"function",
			"impl",
			"keyword",
			"macro",
			"module",
			"primitive",
			"proc_attribute",
			"proc_derive",
			"static",
			"struct",
			"struct_field",
			"trait",
			"trait_alias",
			"type_alias",
			"union",
			"use",
			"variant"
		]),
		label: z.string(),
		name: z.string(),
		path: z.string().nullable(),
		summary: z.string().nullable(),
		visibility: z.string()
	}),
	target: z.string()
}) satisfies ZodType<SymbolLookupOutput>

const lookupSymbolTool: ToolDefinition<
	typeof lookupSymbolInputSchema,
	typeof lookupSymbolOutputSchema
> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Symbol"
	},
	description: "Lookup Rust symbol structure and metadata from docs.rs",
	inputSchema: lookupSymbolInputSchema,
	name: "symbol_lookup",
	outputSchema: lookupSymbolOutputSchema
}

export { lookupSymbolInputSchema, lookupSymbolOutputSchema, lookupSymbolTool }
