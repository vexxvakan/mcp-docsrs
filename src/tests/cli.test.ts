import { describe, expect, test } from "bun:test"
import { errAsync, okAsync } from "neverthrow"
import { createShutdownHandlers, installShutdown, run } from "../cli.ts"
import { ShutdownError, StartupError } from "../errors.ts"
import { APP_VERSION } from "../meta.ts"

const DEFAULT_VALUE = 1
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1

type TestDeps = NonNullable<Parameters<typeof run>[1]>

const createDeps = () => {
	const writes: string[] = []
	let installCount = 0
	let createCount = 0
	let startCount = 0
	const close = () => okAsync(undefined)
	const deps: TestDeps = {
		createServer: () => {
			createCount += 1

			return {
				close,
				config: {
					cacheTtl: DEFAULT_VALUE,
					dbPath: undefined,
					maxCacheSize: DEFAULT_VALUE,
					requestTimeout: DEFAULT_VALUE
				},
				server: {} as never,
				start: () => {
					startCount += 1
					return okAsync(undefined)
				}
			}
		},
		installShutdown: () => {
			installCount += 1
		},
		readEnvConfig: () => ({}),
		write: (message: string) => {
			writes.push(message)
		}
	}

	return {
		close,
		counts: () => ({
			createCount,
			installCount,
			startCount
		}),
		deps,
		writes
	}
}

describe("cli", () => {
	test("renders help without starting the server", async () => {
		const { counts, deps, writes } = createDeps()
		const result = await run(
			[
				"--help"
			],
			deps
		)

		expect(result.isOk()).toBe(true)
		expect(writes[0]).toContain("Usage: mcp-docsrs")
		expect(counts()).toEqual({
			createCount: 0,
			installCount: 0,
			startCount: 0
		})
	})

	test("renders version without starting the server", async () => {
		const { counts, deps, writes } = createDeps()
		const result = await run(
			[
				"--version"
			],
			deps
		)

		expect(result.isOk()).toBe(true)
		expect(writes).toEqual([
			`${APP_VERSION}\n`
		])
		expect(counts()).toEqual({
			createCount: 0,
			installCount: 0,
			startCount: 0
		})
	})

	test("returns startup errors for invalid config", async () => {
		const { counts, deps } = createDeps()
		const result = await run(
			[
				"--cache-ttl=0"
			],
			deps
		)

		expect(result.isErr()).toBe(true)
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(StartupError)
		expect(counts()).toEqual({
			createCount: 0,
			installCount: 0,
			startCount: 0
		})
	})

	test("starts the server and installs shutdown hooks", async () => {
		const { counts, deps } = createDeps()
		const result = await run([], deps)

		expect(result.isOk()).toBe(true)
		expect(counts()).toEqual({
			createCount: 1,
			installCount: 1,
			startCount: 1
		})
	})

	test("propagates startup failures from the server", async () => {
		const { deps } = createDeps()
		deps.createServer = () => ({
			close: () => okAsync(undefined),
			config: {
				cacheTtl: DEFAULT_VALUE,
				dbPath: undefined,
				maxCacheSize: DEFAULT_VALUE,
				requestTimeout: DEFAULT_VALUE
			},
			server: {} as never,
			start: () => errAsync(new StartupError("start the server", new Error("boom")))
		})

		const result = await run([], deps)

		expect(result.isErr()).toBe(true)
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(StartupError)
	})

	test("creates shutdown handlers that close once and exit on signal", async () => {
		const exits: number[] = []
		const logs: unknown[] = []
		let closeCount = 0
		const handlers = createShutdownHandlers(
			() => {
				closeCount += 1
				return okAsync(undefined)
			},
			(code) => {
				exits.push(code)
			},
			(error) => {
				logs.push(error)
			}
		)

		await handlers.sigint()
		await handlers.sigterm()

		expect(closeCount).toBe(1)
		expect(exits).toEqual([
			EXIT_SUCCESS
		])
		expect(logs).toEqual([])
	})

	test("creates error handlers that log and exit on shutdown failure", async () => {
		const exits: number[] = []
		const logs: unknown[] = []
		const handlers = createShutdownHandlers(
			() => errAsync(new ShutdownError("close the server", new Error("close failed"))),
			(code) => {
				exits.push(code)
			},
			(error) => {
				logs.push(error)
			}
		)

		await handlers.uncaughtException(new Error("boom"))

		expect(exits).toEqual([
			EXIT_FAILURE
		])
		expect(logs).toHaveLength(2)
		expect(logs[0]).toBeInstanceOf(Error)
		expect(logs[1]).toBeInstanceOf(ShutdownError)
	})

	test("registers shutdown handlers on process", () => {
		const events: string[] = []
		const originalOn = process.on

		process.on = ((event: string) => {
			events.push(event)
			return process
		}) as typeof process.on

		try {
			installShutdown(() => okAsync(undefined))
		} finally {
			process.on = originalOn
		}

		expect(events).toEqual([
			"SIGINT",
			"SIGTERM",
			"uncaughtException",
			"unhandledRejection"
		])
	})
})
