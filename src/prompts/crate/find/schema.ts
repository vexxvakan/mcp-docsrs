import { type ZodType, z } from "zod"
import type { PromptDefinition } from "../../types.ts"
import type { CrateFindPromptArgs } from "./types.ts"

const crateFindPromptArgsSchema = z.object({
	limit: z.number().optional().describe("Maximum number of results to return"),
	query: z.string().optional().describe("Search query for crate names")
}) satisfies ZodType<CrateFindPromptArgs>

const crateFindPrompt: PromptDefinition<typeof crateFindPromptArgsSchema.shape> = {
	argsSchema: crateFindPromptArgsSchema.shape,
	description: "Find relevant Rust crates on crates.io",
	name: "crate_find"
}

export { crateFindPrompt, crateFindPromptArgsSchema }
