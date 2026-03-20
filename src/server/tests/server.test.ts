import { describe, expect, it } from "bun:test"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createServer } from "../server.ts"

describe("createServer", () => {
	it("creates an McpServer instance", async () => {
		const app = createServer()

		expect(app.server).toBeInstanceOf(McpServer)

		await app.close()
	})
})
