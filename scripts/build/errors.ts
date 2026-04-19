type BuildLog = Bun.BuildOutput["logs"][number]

type BuildTarget = {
	id: string
	label: string
	target?: Bun.Build.CompileTarget
}

const PATH_SEPARATOR = /[\\/]/

const formatPosition = (
	position?: {
		column: number
		file: string
		line: number
	} | null
) =>
	position
		? `${position.file.split(PATH_SEPARATOR).pop()}:${position.line}:${position.column}`
		: "build"

const formatLog = (log: BuildLog) => `${formatPosition(log.position)} ${log.level}: ${log.message}`

const formatLogs = (logs: BuildLog[]) => logs.map(formatLog).join("\n")

const formatErrorEntry = (entry: Error) => {
	const position = (
		entry as Error & {
			position?: {
				column: number
				file: string
				line: number
			}
		}
	).position

	return `${formatPosition(position)} ${entry.message}`
}

const formatAggregateError = (error: AggregateError) => {
	const nested = error.errors
		.map((entry) => {
			if (entry instanceof Error) {
				return formatErrorEntry(entry)
			}

			return String(entry)
		})
		.join("\n")

	return nested ? `${error.message}\n${nested}` : error.message
}

const formatThrownError = (error: unknown) => {
	if (error instanceof AggregateError) {
		return formatAggregateError(error)
	}

	if (error instanceof Error) {
		return error.message
	}

	return String(error)
}

const buildLabel = (build: BuildTarget, appName: string) =>
	build.id === "host" ? appName : `${appName} for ${build.label}`

const buildFailureMessage = (build: BuildTarget, details: string) => {
	const lockedHint = details.includes("EPERM")
		? "\nThe output artifact may be locked by a running executable. Stop the process and retry."
		: ""
	const downloadHint =
		build.target && (details.includes("Failed to download") || details === "Bundle failed")
			? "\nCross-target compilation may need Bun to download the target runtime before the first build."
			: ""

	return `Build failed for '${build.id}'.${details ? `\n${details}` : ""}${lockedHint}${downloadHint}`
}

export { buildFailureMessage, buildLabel, formatLogs, formatThrownError }
