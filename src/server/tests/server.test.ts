// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture data uses upstream snake_case keys
import { describe, expect, it } from "bun:test"
import { ShutdownError } from "@mcp-docsrs/errors"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { closeServer, createServer, startServer } from "../server.ts"

describe("createServer", () => {
	it("returns ok when already closed", async () => {
		let closeCount = 0
		const server = {
			close: () => {
				closeCount += 1
			}
		} as unknown as McpServer
		const fetcher = {
			close: () => undefined
		}
		const state = {
			isClosed: true
		}

		await closeServer(server, fetcher, state)
		expect(closeCount).toBe(0)
	})

	it("closes once and then short-circuits repeated close calls", async () => {
		let closeCount = 0
		const server = {
			close: () => {
				closeCount += 1
			}
		} as unknown as McpServer
		const fetcher = {
			close: () => undefined
		}
		const state = {
			isClosed: false
		}

		await closeServer(server, fetcher, state)
		await closeServer(server, fetcher, state)
		expect(closeCount).toBe(1)
	})

	it("continues when close is not connected", async () => {
		let fetchCount = 0
		const server = {
			close: () => {
				throw new Error("not connected")
			}
		} as unknown as McpServer
		const fetcher = {
			close: () => {
				fetchCount += 1
			}
		}
		const state = {
			isClosed: false
		}

		await closeServer(server, fetcher, state)
		expect(fetchCount).toBe(1)
	})

	it("starts the server through the helper", async () => {
		let connectCount = 0
		const server = {
			connect: () => {
				connectCount += 1
			}
		} as unknown as McpServer

		await startServer(server, {
			cacheTtl: 1,
			dbPath: undefined,
			maxCacheSize: 1,
			requestTimeout: 1
		})
		expect(connectCount).toBe(1)
	})

	it("wraps helper start failures", async () => {
		const server = {
			connect: () => {
				throw new Error("connect failed")
			}
		} as unknown as McpServer

		try {
			await startServer(server, {
				cacheTtl: 1,
				dbPath: undefined,
				maxCacheSize: 1,
				requestTimeout: 1
			})
			throw new Error("Expected helper start to throw")
		} catch (error) {
			expect(error).toBeInstanceOf(Error)
			expect((error as Error).message).toBe("connect failed")
		}
	})

	it("creates an McpServer instance", async () => {
		const app = createServer()

		expect(app.server).toBeInstanceOf(McpServer)

		expect(
			await app.close().match(
				() => true,
				() => false
			)
		).toBe(true)
	})

	it("returns ok when start succeeds", async () => {
		const app = createServer()

		app.server.connect = (async (..._args: Parameters<typeof app.server.connect>) =>
			undefined) as typeof app.server.connect

		expect(
			await app.start().match(
				() => true,
				() => false
			)
		).toBe(true)
	})

	it("wraps start failures", async () => {
		const app = createServer()

		app.server.connect = ((..._args: Parameters<typeof app.server.connect>) =>
			Promise.reject(new Error("connect failed"))) as typeof app.server.connect

		expect(
			await app.start().match(
				() => false,
				() => true
			)
		).toBe(true)
	})

	it("allows repeated close calls", async () => {
		const app = createServer()

		expect(
			await app.close().match(
				() => true,
				() => false
			)
		).toBe(true)
		expect(
			await app.close().match(
				() => true,
				() => false
			)
		).toBe(true)
	})

	it("swallows unconnected close errors", async () => {
		const app = createServer()

		app.server.close = (() => Promise.reject(new Error("not connected"))) as typeof app.server.close

		expect(
			await app.close().match(
				() => true,
				() => false
			)
		).toBe(true)
	})

	it("wraps fetcher close failures", async () => {
		const app = createServer(
			{},
			{
				fetcher: {
					clearCache: () => undefined,
					close: () => {
						throw new Error("close failed")
					},
					load: async () => ({
						data: {
							crate_version: "1.2.3",
							external_crates: {},
							format_version: 57,
							includes_private: false,
							index: {},
							paths: {},
							root: 0,
							target: {
								target_features: [],
								triple: "x86_64-unknown-linux-gnu"
							}
						},
						fromCache: true
					})
				}
			}
		)

		expect((await app.close())._unsafeUnwrapErr()).toBeInstanceOf(ShutdownError)
	})
})
