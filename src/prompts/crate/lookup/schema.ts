import { type ZodType, z } from "zod"
import type { PromptDefinition } from "../../types.ts"
import type { CrateLookupPromptArgs } from "./types.ts"

const crateLookupPromptArgsSchema = z.object({
	crateName: z.string().optional().describe("Name of the Rust crate to analyze"),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<CrateLookupPromptArgs>

const crateLookupPrompt: PromptDefinition<typeof crateLookupPromptArgsSchema.shape> = {
	argsSchema: crateLookupPromptArgsSchema.shape,
	description: "Analyze a Rust crate overview, public API surface, and main modules",
	name: "crate_lookup"
}

export { crateLookupPrompt, crateLookupPromptArgsSchema }
