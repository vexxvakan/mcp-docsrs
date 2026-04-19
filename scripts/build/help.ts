const usage = () =>
	`Usage: bun run build -- [target] [--clean]

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

export { usage }
