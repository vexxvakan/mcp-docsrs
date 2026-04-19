import { describe, expect, test } from "bun:test"
import { CrateNotFoundError, JsonParseError, StartupError } from "../errors.ts"
import {
	createErrorResult,
	createStructuredResult,
	createTextResult,
	toErrorMessage
} from "./shared.ts"

describe("tools shared helpers", () => {
	test("creates tool result envelopes", () => {
		expect(createTextResult("hello")).toEqual({
			content: [
				{
					text: "hello",
					type: "text"
				}
			]
		})
		expect(
			createStructuredResult(
				{
					ok: true
				},
				"done"
			)
		).toEqual({
			content: [
				{
					text: "done",
					type: "text"
				}
			],
			structuredContent: {
				ok: true
			}
		})
		expect(createErrorResult("boom")).toEqual({
			content: [
				{
					text: "boom",
					type: "text"
				}
			],
			isError: true
		})
	})

	test("formats tool errors with specific fallbacks", () => {
		expect(toErrorMessage(new JsonParseError(new Error("bad json")))).toBe(
			"Failed to parse JSON from docs.rs. The response may not be valid rustdoc JSON."
		)
		expect(toErrorMessage(new CrateNotFoundError("demo"))).toContain("Crate 'demo' not found.")
		expect(toErrorMessage(new StartupError("start the server", new Error("boom")))).toBe(
			"Failed to start the server: boom"
		)
		expect(toErrorMessage(new Error("plain"))).toBe("plain")
		expect(toErrorMessage({})).toBe("Unknown error occurred")
	})
})
