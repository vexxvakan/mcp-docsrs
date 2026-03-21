#!/usr/bin/env bun

import { mkdir, rm, stat } from "node:fs/promises"
import { basename, extname, join } from "node:path"
import { APP_NAME } from "../src/meta.ts"
import { normalizeVersion, resolveBuildVersion } from "./version.ts"

const ENTRYPOINT = "./src/cli.ts"
const DIST_DIR = "./dist"
const TARGET_LABEL_WIDTH = 18
const HELP_FLAGS = new Set([
	"--help",
	"-h"
])
const LIST_FLAGS = new Set([
	"list",
	"--list"
])
const ALL_TARGET = "all"
const HOST_TARGET = "host"
type BuildTarget = {
	id: string
	label: string
	outfile: string
	target?: Bun.Build.CompileTarget
}

type BuildLog = Bun.BuildOutput["logs"][number]

const TARGETS: readonly BuildTarget[] = [
	{
		id: HOST_TARGET,
		label: "current platform",
		outfile: join(DIST_DIR, APP_NAME)
	},
	{
		id: "linux-x64",
		label: "Linux x64",
		outfile: join(DIST_DIR, `${APP_NAME}-linux-x64`),
		target: "bun-linux-x64"
	},
	{
		id: "linux-arm64",
		label: "Linux arm64",
		outfile: join(DIST_DIR, `${APP_NAME}-linux-arm64`),
		target: "bun-linux-arm64"
	},
	{
		id: "linux-x64-musl",
		label: "Linux x64 musl",
		outfile: join(DIST_DIR, `${APP_NAME}-linux-x64-musl`),
		target: "bun-linux-x64-musl"
	},
	{
		id: "linux-arm64-musl",
		label: "Linux arm64 musl",
		outfile: join(DIST_DIR, `${APP_NAME}-linux-arm64-musl`),
		target: "bun-linux-arm64-musl"
	},
	{
		id: "darwin-x64",
		label: "macOS x64",
		outfile: join(DIST_DIR, `${APP_NAME}-darwin-x64`),
		target: "bun-darwin-x64"
	},
	{
		id: "darwin-arm64",
		label: "macOS arm64",
		outfile: join(DIST_DIR, `${APP_NAME}-darwin-arm64`),
		target: "bun-darwin-arm64"
	},
	{
		id: "windows-x64",
		label: "Windows x64",
		outfile: join(DIST_DIR, `${APP_NAME}-windows-x64.exe`),
		target: "bun-windows-x64"
	}
]

const TARGET_LOOKUP = new Map(
	TARGETS.flatMap((build) => [
		[
			build.id,
			build
		],
		...(build.target
			? [
					[
						build.target,
						build
					] as const
				]
			: [])
	])
)

const usage = () =>
	`
Usage: bun run build -- [target] [--clean]

Targets:
  host                Build the current platform executable (default)
  all                 Build every release artifact
  list                Print the available build targets
  linux-x64
  linux-arm64
  linux-x64-musl
  linux-arm64-musl
  darwin-x64
  darwin-arm64
  windows-x64

Options:
  --target <name>     Select a target explicitly
  --clean             Remove the target artifact before building
  --help, -h          Show help
`.trim()

const readArgValue = (args: string[], name: string) => {
	for (const arg of args) {
		if (arg.startsWith(`${name}=`)) {
			return arg.slice(name.length + 1)
		}
	}

	const index = args.indexOf(name)
	if (index < 0) {
		return
	}

	return args[index + 1]
}

const parseArgs = (args: string[]) => {
	const positional = args.filter((arg) => !arg.startsWith("--"))
	const targetArg = readArgValue(args, "--target")
	const targetName = targetArg ?? positional[0] ?? HOST_TARGET

	return {
		clean: args.includes("--clean"),
		showHelp: args.some((arg) => HELP_FLAGS.has(arg)),
		showList: args.some((arg) => LIST_FLAGS.has(arg)),
		targetName
	}
}

const resolveTarget = (name: string) => {
	if (name === ALL_TARGET) {
		return TARGETS.filter((build) => build.id !== HOST_TARGET)
	}

	if (name === HOST_TARGET) {
		return [
			TARGETS[0]
		]
	}

	const build = TARGET_LOOKUP.get(name)
	if (!build) {
		throw new Error(
			`Unknown build target '${name}'. Run 'bun run build -- list' for valid targets.`
		)
	}

	return [
		build
	]
}

const buildPaths = (outfile: string) => {
	if (extname(outfile) === ".exe") {
		return [
			outfile
		]
	}

	return [
		outfile,
		`${outfile}.exe`
	]
}

const removeOutputs = async (outfile: string) => {
	await Promise.all(
		buildPaths(outfile).map((file) =>
			rm(file, {
				force: true
			})
		)
	)
}

const findOutputPath = async (outfile: string) => {
	const files = buildPaths(outfile)
	const existing = await Promise.all(
		files.map(async (file) => ({
			exists: await Bun.file(file).exists(),
			file
		}))
	)

	const match = existing.find((entry) => entry.exists)
	if (match) {
		return match.file
	}

	throw new Error(`Build completed without producing '${outfile}'.`)
}

const formatSize = (size: number) => new Intl.NumberFormat("en-US").format(size)

const formatLogs = (logs: BuildLog[]) =>
	logs
		.map((log) => {
			const location = log.position
				? `${basename(log.position.file)}:${log.position.line}:${log.position.column}`
				: "build"
			return `${location} ${log.level}: ${log.message}`
		})
		.join("\n")

const writeLine = (message: string) => {
	process.stdout.write(`${message}\n`)
}

const writeError = (message: string) => {
	process.stderr.write(`${message}\n`)
}

const APP_VERSION = resolveBuildVersion(
	import.meta.dir,
	normalizeVersion(Bun.env.APP_VERSION ?? "")
)

const buildLabel = (build: BuildTarget) =>
	build.id === HOST_TARGET ? APP_NAME : `${APP_NAME} for ${build.label}`

const buildErrorMessage = (build: BuildTarget, details: string) => {
	const lockedHint = details.includes("EPERM")
		? "\nThe output artifact may be locked by a running executable. Stop the process and retry."
		: ""
	const downloadHint =
		build.target && (details.includes("Failed to download") || details === "Bundle failed")
			? "\nCross-target compilation may need Bun to download the target runtime before the first build."
			: ""

	return `Build failed for '${build.id}'.${details ? `\n${details}` : ""}${lockedHint}${downloadHint}`
}

const buildTarget = async (build: BuildTarget, clean: boolean) => {
	if (clean) {
		await removeOutputs(build.outfile)
	}

	writeLine(`Building ${buildLabel(build)}...`)

	try {
		const result = await Bun.build({
			bytecode: true,
			compile: build.target
				? {
						outfile: build.outfile,
						target: build.target
					}
				: {
						outfile: build.outfile
					},
			define: {
				// biome-ignore lint/style/useNamingConvention: important global constant
				BUILD_VERSION: JSON.stringify(APP_VERSION)
			},
			entrypoints: [
				ENTRYPOINT
			],
			minify: true
		})

		if (!result.success) {
			throw new Error(buildErrorMessage(build, formatLogs(result.logs)))
		}

		const outputPath = await findOutputPath(build.outfile)
		const info = await stat(outputPath)
		writeLine(`Built ${buildLabel(build)} -> ${outputPath} (${formatSize(info.size)} bytes)`)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (message.startsWith(`Build failed for '${build.id}'.`)) {
			throw error
		}
		throw new Error(buildErrorMessage(build, message))
	}
}

const printTargets = () => {
	for (const build of TARGETS) {
		const target = build.target ? ` (${build.target})` : ""
		writeLine(`${build.id.padEnd(TARGET_LABEL_WIDTH)} ${build.label}${target}`)
	}
}

const runBuilds = (targets: readonly BuildTarget[], clean: boolean) =>
	targets.reduce(
		(previous, build) => previous.then(() => buildTarget(build, clean)),
		Promise.resolve()
	)

const run = async () => {
	const args = Bun.argv.slice(2)
	const options = parseArgs(args)

	if (options.showHelp) {
		writeLine(usage())
		return
	}

	if (options.showList) {
		printTargets()
		return
	}

	await mkdir(DIST_DIR, {
		recursive: true
	})
	const targets = resolveTarget(options.targetName)
	await runBuilds(targets, options.clean)
}

run().catch((error) => {
	const message = error instanceof Error ? error.message : String(error)
	writeError(message)
	process.exit(1)
})
