import { describe, expect, test } from "bun:test"
import { createCrateFindPromptHandler } from "./handler.ts"

const getText = async (value: ReturnType<ReturnType<typeof createCrateFindPromptHandler>>) => {
	const result = await value
	return result.messages[0]?.content.type === "text" ? result.messages[0].content.text : ""
}

describe("createCrateFindPromptHandler", () => {
	test("missing-query", async () => {
		expect(await getText(createCrateFindPromptHandler()({}))).toBe(
			"What would you like to search for on crates.io? Please provide a crate name or topic."
		)
	})

	test("success", async () => {
		expect(
			await getText(
				createCrateFindPromptHandler()({
					limit: 5,
					query: "async runtime"
				})
			)
		).toBe(
			'Find Rust crates matching "async runtime" with a limit of 5 using the crate_find tool. Summarize the most relevant matches and explain why they look useful.'
		)
	})
})
