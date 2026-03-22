import { type ZodType, z } from "zod"
import type { PromptDefinition } from "../../types.ts"
import type { CrateDocsPromptArgs } from "./types.ts"

const crateDocsPromptArgsSchema = z.object({
	crateName: z.string().optional().describe("Name of the Rust crate to inspect"),
	target: z.string().optional().describe("Target platform"),
	version: z.string().optional().describe("Specific version or semver range")
}) satisfies ZodType<CrateDocsPromptArgs>

const crateDocsPrompt: PromptDefinition<typeof crateDocsPromptArgsSchema.shape> = {
	argsSchema: crateDocsPromptArgsSchema.shape,
	description: "Inspect full crate-level Rust documentation text",
	name: "crate_docs"
}

export { crateDocsPrompt, crateDocsPromptArgsSchema }
