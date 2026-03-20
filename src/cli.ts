#!/usr/bin/env bun

import {
	parseCliFlags,
	readEnvConfig,
	renderHelp,
	resolveConfig,
	validateConfig
} from "./config/index.ts"
import { ErrorLogger } from "./errors.ts"
import { APP_VERSION } from "./meta.ts"
import { createServer } from "./server/server.ts"

const exitOnFailure = (error: unknown) => {
	ErrorLogger.log(error)
	process.exit(1)
}

const installShutdown = (close: () => Promise<void>) => {
	let shuttingDown = false

	const shutdown = async (exitCode: number) => {
		if (shuttingDown) {
			return
		}

		shuttingDown = true
		await close()
		process.exit(exitCode)
	}

	process.on("SIGINT", () => {
		shutdown(0).catch(exitOnFailure)
	})

	process.on("SIGTERM", () => {
		shutdown(0).catch(exitOnFailure)
	})

	process.on("uncaughtException", (error) => {
		ErrorLogger.log(error)
		shutdown(1).catch(exitOnFailure)
	})

	process.on("unhandledRejection", (error) => {
		ErrorLogger.log(error)
		shutdown(1).catch(exitOnFailure)
	})
}

const run = async () => {
	const flags = parseCliFlags()
	if (flags.showHelp) {
		process.stdout.write(`${renderHelp()}\n`)
		return
	}
	if (flags.showVersion) {
		process.stdout.write(`${APP_VERSION}\n`)
		return
	}

	const config = validateConfig(
		resolveConfig({
			...readEnvConfig(),
			...flags.overrides
		})
	)
	const app = createServer(config)
	installShutdown(app.close)
	await app.start()
}

run().catch(exitOnFailure)
