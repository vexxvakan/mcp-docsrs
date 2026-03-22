import { describe, expect, test } from "bun:test"
import { createCrateDocsPromptHandler } from "./handler.ts"

const getText = async (value: ReturnType<ReturnType<typeof createCrateDocsPromptHandler>>) => {
	const result = await value
	return result.messages[0]?.content.type === "text" ? result.messages[0].content.text : ""
}

describe("createCrateDocsPromptHandler", () => {
	test("missing-crate", async () => {
		expect(await getText(createCrateDocsPromptHandler()({}))).toBe(
			"Which Rust crate would you like full crate-level documentation for? Please provide the crate name."
		)
	})

	test("success", async () => {
		expect(
			await getText(
				createCrateDocsPromptHandler()({
					crateName: "tokio",
					target: "x86_64-unknown-linux-gnu",
					version: "1.0.0"
				})
			)
		).toContain(
			'Please retrieve and analyze the full crate-level documentation for the Rust crate "tokio" version 1.0.0 for target x86_64-unknown-linux-gnu using the crate_docs tool.'
		)
	})
})
