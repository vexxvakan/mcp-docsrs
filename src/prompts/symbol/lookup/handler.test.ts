import { describe, expect, test } from "bun:test"
import { createLookupSymbolPromptHandler } from "./handler.ts"

const getText = async (value: ReturnType<ReturnType<typeof createLookupSymbolPromptHandler>>) => {
	const result = await value
	return result.messages[0]?.content.type === "text" ? result.messages[0].content.text : ""
}

describe("createLookupSymbolPromptHandler", () => {
	test.each([
		[
			"missing-all",
			{},
			'I need the crate name, symbol type, and symbol name. For example: crateName "tokio", symbolType "struct", symbolname "runtime::Runtime".'
		],
		[
			"missing-crate",
			{
				symbolname: "runtime::Runtime",
				symbolType: "struct"
			},
			'Which Rust crate contains the struct "runtime::Runtime"? Please provide the crate name.'
		],
		[
			"missing-type",
			{
				crateName: "tokio",
				symbolname: "runtime::Runtime"
			},
			'What rustdoc symbol type should I use for "runtime::Runtime" in the crate "tokio"? For example "struct", "function", or "trait".'
		],
		[
			"missing-name",
			{
				crateName: "tokio",
				symbolType: "struct"
			},
			'What symbol name or path from the "tokio" crate would you like me to inspect as a struct?'
		]
	])("%s", async (_name, args, expected) => {
		expect(await getText(createLookupSymbolPromptHandler()(args))).toBe(expected)
	})

	test("success", async () => {
		expect(
			await getText(
				createLookupSymbolPromptHandler()({
					crateName: "tokio",
					symbolname: "runtime::Runtime",
					symbolType: "struct",
					target: "x86_64-unknown-linux-gnu",
					version: "1.0.0"
				})
			)
		).toContain(
			'Please inspect the struct "runtime::Runtime" from the Rust crate "tokio" version 1.0.0 for target x86_64-unknown-linux-gnu using the symbol_lookup tool.'
		)
	})
})
