import { describe, expect, test } from "bun:test"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerPrompts } from "./register.ts"

type RegisteredPromptCall = {
	config: {
		argsSchema: unknown
		description: string
	}
	handler: unknown
	name: string
}

const createServer = () => {
	const calls: RegisteredPromptCall[] = []
	const server = {
		registerPrompt: (name: string, config: RegisteredPromptCall["config"], handler: unknown) => {
			calls.push({
				config,
				handler,
				name
			})
		}
	} as unknown as McpServer

	return {
		calls,
		server
	}
}

describe("registerPrompts", () => {
	test("registers all prompts", () => {
		const { calls, server } = createServer()

		registerPrompts(server)

		expect(calls.map((call) => call.name)).toEqual([
			"crate_lookup",
			"lookup_symbol",
			"crate_docs",
			"symbol_docs",
			"crate_find"
		])
		expect(calls.every((call) => typeof call.handler === "function")).toBe(true)
		expect(calls.every((call) => typeof call.config.description === "string")).toBe(true)
		expect(calls.every((call) => call.config.argsSchema)).toBe(true)
	})
})
