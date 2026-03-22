import { describe, expect, test } from "bun:test"
import { createCrateLookupPromptHandler } from "./handler.ts"

const getText = async (value: ReturnType<ReturnType<typeof createCrateLookupPromptHandler>>) => {
	const result = await value
	return result.messages[0]?.content.type === "text" ? result.messages[0].content.text : ""
}

describe("createCrateLookupPromptHandler", () => {
	test("missing-crate", async () => {
		expect(await getText(createCrateLookupPromptHandler()({}))).toBe(
			"Which Rust crate would you like to analyze? Please provide the crate name."
		)
	})

	test("success", async () => {
		expect(
			await getText(
				createCrateLookupPromptHandler()({
					crateName: "tokio",
					target: "x86_64-unknown-linux-gnu",
					version: "1.0.0"
				})
			)
		).toBe(
			'Please analyze the Rust crate "tokio" version 1.0.0 for target x86_64-unknown-linux-gnu using the crate_lookup tool.'
		)
	})
})
