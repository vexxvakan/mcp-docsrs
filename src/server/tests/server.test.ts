import { describe, expect, it } from "bun:test"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StartupError } from "../../errors.ts"
import { createServer } from "../server.ts"

describe("createServer", () => {
	it("creates an McpServer instance", async () => {
		const app = createServer()

		expect(app.server).toBeInstanceOf(McpServer)

		expect((await app.close()).isOk()).toBe(true)
	})

	it("returns ok when start succeeds", async () => {
		const app = createServer()

		app.server.connect = (async (..._args: Parameters<typeof app.server.connect>) =>
			undefined) as typeof app.server.connect

		expect((await app.start()).isOk()).toBe(true)
	})

	it("wraps start failures", async () => {
		const app = createServer()

		app.server.connect = ((..._args: Parameters<typeof app.server.connect>) =>
			Promise.reject(new Error("connect failed"))) as typeof app.server.connect

		expect((await app.start())._unsafeUnwrapErr()).toBeInstanceOf(StartupError)
	})

	it("allows repeated close calls", async () => {
		const app = createServer()

		expect((await app.close()).isOk()).toBe(true)
		expect((await app.close()).isOk()).toBe(true)
	})

	it("swallows unconnected close errors", async () => {
		const app = createServer()

		app.server.close = (() => Promise.reject(new Error("not connected"))) as typeof app.server.close

		expect((await app.close()).isOk()).toBe(true)
	})
})
