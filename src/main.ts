import { ErrorLogger, StartupError, trySync } from "@mcp-docsrs/errors"
import { errAsync, okAsync } from "neverthrow"
import {
	parseCliFlags,
	readEnvConfig,
	renderHelp,
	resolveConfig,
	validateConfig
} from "./config/index.ts"
import { APP_VERSION } from "./meta.ts"
import { createServer } from "./server/server.ts"

type CliDeps = {
	createServer: typeof createServer
	installShutdown: typeof installShutdown
	readEnvConfig: typeof readEnvConfig
	write: (message: string) => unknown
}

const createExitOnFailure =
	(exit: (code: number) => unknown, log = ErrorLogger.log) =>
	(error: unknown) => {
		log(error)
		exit(1)
		return undefined as never
	}

const createShutdownHandlers = (
	close: ReturnType<typeof createServer>["close"],
	exit: (code: number) => unknown,
	log = ErrorLogger.log
) => {
	let shuttingDown = false
	const fail = createExitOnFailure(exit, log)

	const shutdown = async (exitCode: number) => {
		if (shuttingDown) {
			return
		}

		shuttingDown = true
		const result = await close()
		result.match(() => exit(exitCode), fail)
	}

	return {
		sigint: () => shutdown(0).catch(fail),
		sigterm: () => shutdown(0).catch(fail),
		uncaughtException: (error: unknown) => {
			log(error)
			return shutdown(1).catch(fail)
		},
		unhandledRejection: (error: unknown) => {
			log(error)
			return shutdown(1).catch(fail)
		}
	}
}

const installShutdown = (close: ReturnType<typeof createServer>["close"]) => {
	const handlers = createShutdownHandlers(close, (code) => process.exit(code))

	process.on("SIGINT", handlers.sigint)
	process.on("SIGTERM", handlers.sigterm)
	process.on("uncaughtException", handlers.uncaughtException)
	process.on("unhandledRejection", handlers.unhandledRejection)
}

const defaultDeps: CliDeps = {
	createServer,
	installShutdown,
	readEnvConfig,
	write: (message: string) => process.stdout.write(message)
}

const run = (args?: string[], deps: CliDeps = defaultDeps) => {
	const flags = parseCliFlags(args)
	if (flags.showHelp) {
		deps.write(`${renderHelp()}\n`)
		return okAsync(undefined)
	}
	if (flags.showVersion) {
		deps.write(`${APP_VERSION}\n`)
		return okAsync(undefined)
	}

	const configResult = trySync(
		() =>
			validateConfig(
				resolveConfig({
					...deps.readEnvConfig(),
					...flags.overrides
				})
			),
		(error) => new StartupError("resolve CLI configuration", error)
	)
	if (configResult.isErr()) {
		return errAsync(configResult.error)
	}

	const app = deps.createServer(configResult.value)
	deps.installShutdown(app.close)

	return app.start()
}

export { createShutdownHandlers, installShutdown, run }
