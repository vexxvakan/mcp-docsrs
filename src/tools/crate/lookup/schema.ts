import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { CrateLookupInput, CrateLookupOutput } from "./types.ts"

const crateLookupInputSchema = z.object({
	crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
	formatVersion: z.number().optional().describe("Rustdoc JSON format version"),
	target: z.string().optional().describe('Target platform, for example "i686-pc-windows-msvc"'),
	version: z
		.string()
		.optional()
		.describe('Specific version or semver range, for example "1.0.0" or "~4"')
}) satisfies ZodType<CrateLookupInput>

const crateLookupOutputSchema = z.object({
	crateName: z.string(),
	crateVersion: z.string().nullable(),
	formatVersion: z.number(),
	sections: z.array(
		z.object({
			count: z.number(),
			items: z.array(
				z.object({
					name: z.string(),
					path: z.string().nullable(),
					summary: z.string().nullable()
				})
			),
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
			label: z.string()
		})
	),
	summary: z.string().nullable(),
	target: z.string(),
	totalItems: z.number()
}) satisfies ZodType<CrateLookupOutput>

const crateLookupTool: ToolDefinition<
	typeof crateLookupInputSchema,
	typeof crateLookupOutputSchema
> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Crate"
	},
	description: "Lookup Rust crate structure and public API overview from docs.rs",
	inputSchema: crateLookupInputSchema,
	name: "crate_lookup",
	outputSchema: crateLookupOutputSchema
}

export { crateLookupInputSchema, crateLookupOutputSchema, crateLookupTool }
