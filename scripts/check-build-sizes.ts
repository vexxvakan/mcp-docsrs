#!/usr/bin/env bun

/**
 * Script to check the output sizes of all build targets
 * Run this to get accurate sizes for updating the README
 */

import { promises as fs } from "node:fs"
import { join } from "node:path"

interface BuildInfo {
	target: string
	platform: string
	type: string
	filename: string
	size?: number
	exists?: boolean
}

const builds: BuildInfo[] = [
	{
		target: "linux-x64",
		platform: "Linux x64/AMD64",
		type: "GLIBC + Bytecode",
		filename: "mcp-docsrs-linux-x64"
	},
	{
		target: "linux-arm64",
		platform: "Linux ARM64",
		type: "GLIBC + Bytecode",
		filename: "mcp-docsrs-linux-arm64"
	},
	{
		target: "linux-x64-musl",
		platform: "Linux x64/AMD64",
		type: "MUSL (static) + Bytecode",
		filename: "mcp-docsrs-linux-x64-musl"
	},
	{
		target: "linux-arm64-musl",
		platform: "Linux ARM64",
		type: "MUSL (static) + Bytecode",
		filename: "mcp-docsrs-linux-arm64-musl"
	},
	{
		target: "darwin-x64",
		platform: "macOS Intel",
		type: "Bytecode",
		filename: "mcp-docsrs-darwin-x64"
	},
	{
		target: "darwin-arm64",
		platform: "macOS Apple Silicon",
		type: "Bytecode",
		filename: "mcp-docsrs-darwin-arm64"
	},
	{
		target: "windows-x64",
		platform: "Windows x64",
		type: "Bytecode",
		filename: "mcp-docsrs-windows-x64.exe"
	}
]

async function getFileSize(filepath: string): Promise<number | undefined> {
	try {
		const stats = await fs.stat(filepath)
		return stats.size
	} catch {
		return undefined
	}
}

function formatSize(bytes: number): string {
	const mb = bytes / (1024 * 1024)
	return `~${Math.round(mb)}MB`
}

async function checkBuildSizes() {
	console.log("🔍 Checking build sizes...\n")

	const distDir = join(process.cwd(), "dist")

	// Check if dist directory exists
	try {
		await fs.access(distDir)
	} catch {
		console.log("❌ dist/ directory not found. Run 'bun run build:all' first.")
		process.exit(1)
	}

	// Check sizes
	for (const build of builds) {
		const filepath = join(distDir, build.filename)
		const size = await getFileSize(filepath)

		if (size !== undefined) {
			build.size = size
			build.exists = true
		} else {
			build.exists = false
		}
	}

	// Check if any builds exist
	const existingBuilds = builds.filter((b) => b.exists)

	if (existingBuilds.length === 0) {
		console.log("❌ No executables found in dist/ directory\n")
		console.log("📦 Executables not yet built\n")
		console.log("To build all targets, run:")
		console.log("  bun run build:all\n")
		console.log("To build a specific target, run:")
		console.log("  bun run build:linux-x64")
		console.log("  bun run build:darwin-arm64")
		console.log("  bun run build:windows-x64")
		console.log("  ... etc\n")
		return
	}

	// Display results
	console.log("📊 Build Sizes Report\n")
	console.log("| File | Platform | Type | Size |")
	console.log("|------|----------|------|------|")

	for (const build of builds) {
		if (build.exists && build.size) {
			console.log(
				`| \`${build.filename}\` | ${build.platform} | ${build.type} | ${formatSize(
					build.size
				)} |`
			)
		} else {
			console.log(`| \`${build.filename}\` | ${build.platform} | ${build.type} | ❌ Not found |`)
		}
	}

	// Summary
	console.log("\n📝 Summary:")
	console.log(`- Found ${existingBuilds.length}/${builds.length} builds`)

	if (existingBuilds.length > 0) {
		const sizes = existingBuilds.map((b) => b.size!)
		const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
		const minSize = Math.min(...sizes)
		const maxSize = Math.max(...sizes)

		console.log(`- Average size: ${formatSize(avgSize)}`)
		console.log(`- Smallest: ${formatSize(minSize)}`)
		console.log(`- Largest: ${formatSize(maxSize)}`)
	}

	console.log("\n💡 Tip: Copy the table above to update the README.md Build Output section")
}

// Run the check
await checkBuildSizes()
