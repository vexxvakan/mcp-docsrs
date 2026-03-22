import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { CrateDocsInput } from "./types.ts"

const crateDocsInputSchema = z.object({
	crateName: z.string().describe("Name of the Rust crate to lookup documentation for"),
	formatVersion: z.number().optional().describe("Rustdoc JSON format version"),
	target: z.string().optional().describe('Target platform, for example "i686-pc-windows-msvc"'),
	version: z
		.string()
		.optional()
		.describe('Specific version or semver range, for example "1.0.0" or "~4"')
}) satisfies ZodType<CrateDocsInput>

const crateDocsTool: ToolDefinition<typeof crateDocsInputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Lookup Rust Crate Docs"
	},
	description: "Lookup full crate-level documentation from docs.rs",
	inputSchema: crateDocsInputSchema,
	name: "crate_docs"
}

export { crateDocsInputSchema, crateDocsTool }
