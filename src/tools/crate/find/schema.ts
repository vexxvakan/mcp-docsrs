import { type ZodType, z } from "zod"
import type { ToolDefinition } from "../../types.ts"
import type { FindCratesArgs, FindCratesOutput } from "./types.ts"

const FIND_LIMIT_DEFAULT = 10

const crateFindInputSchema = z.object({
	limit: z
		.number()
		.optional()
		.default(FIND_LIMIT_DEFAULT)
		.describe("Maximum number of results to return"),
	query: z.string().describe("Search query for crate names (supports partial matches)")
}) satisfies ZodType<FindCratesArgs>

const crateFindOutputSchema = z.object({
	crates: z.array(
		z.object({
			createdAt: z.string().nullable(),
			description: z.string().nullable(),
			documentation: z.string().nullable(),
			downloads: z.number(),
			homepage: z.string().nullable(),
			maxVersion: z.string(),
			name: z.string(),
			recentDownloads: z.number(),
			repository: z.string().nullable(),
			updatedAt: z.string().nullable()
		})
	),
	query: z.string(),
	returned: z.number(),
	total: z.number()
}) satisfies ZodType<FindCratesOutput>

const crateFindTool: ToolDefinition<typeof crateFindInputSchema, typeof crateFindOutputSchema> = {
	annotations: {
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
		title: "Find Rust Crates"
	},
	description: "Search for Rust crates on crates.io with fuzzy and partial name matching",
	inputSchema: crateFindInputSchema,
	name: "crate_find",
	outputSchema: crateFindOutputSchema
}

export { crateFindInputSchema, crateFindOutputSchema, crateFindTool, FIND_LIMIT_DEFAULT }
