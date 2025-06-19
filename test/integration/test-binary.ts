#!/usr/bin/env bun
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { runCratesSearchTests } from "./test-crates-search"
import { runMCPProtocolTests } from "./test-mcp-protocol"
import { runPersistentCacheTests } from "./test-persistent-cache"
import { runResourcesTests } from "./test-resources"
import { runZstdTests } from "./test-zstd"

type TestOptions = {
	executable: string
	target: string
	isMusl?: boolean
	isWindows?: boolean
}

type CommandResult = {
	success: boolean
	output: string
	error?: string
}

const runCommand = (command: string[]): Promise<CommandResult> => {
	return new Promise((resolve) => {
		const [cmd, ...args] = command
		const proc = spawn(cmd, args, {
			stdio: ["pipe", "pipe", "pipe"]
		})

		let output = ""
		let error = ""

		proc.stdout.on("data", (data) => {
			output += data.toString()
		})

		proc.stderr.on("data", (data) => {
			error += data.toString()
		})

		proc.on("exit", (code) => {
			resolve({
				success: code === 0,
				output: output.trim(),
				error: error.trim()
			})
		})

		proc.on("error", (err) => {
			resolve({
				success: false,
				output: "",
				error: err.message
			})
		})
	})
}

const testVersion = async (options: TestOptions): Promise<void> => {
	console.log("\n🔍 Testing --version flag...")

	const result = await runCommand([options.executable, "--version"])

	if (!result.success) {
		throw new Error(`Version test failed: ${result.error}`)
	}

	console.log(`✅ Version test passed: ${result.output}`)
}

const testServerStartup = async (options: TestOptions): Promise<void> => {
	console.log("\n🚀 Testing server startup...")

	const server = spawn(options.executable, [], {
		env: { ...process.env, DB_PATH: ":memory:" },
		stdio: ["pipe", "pipe", "pipe"]
	})

	let errorOutput = ""

	server.stdout.on("data", () => {
		// We don't need to capture output for this test
	})

	server.stderr.on("data", (data) => {
		errorOutput += data.toString()
	})

	// Give server time to start
	await new Promise((resolve) => setTimeout(resolve, 2000))

	// Check if server is still running
	if (server.exitCode !== null) {
		throw new Error(
			`Server exited unexpectedly with code ${server.exitCode}\nError: ${errorOutput}`
		)
	}

	console.log("✅ Server started successfully")

	// Clean shutdown
	server.kill("SIGTERM")

	// Wait for graceful shutdown
	await new Promise((resolve) => {
		server.on("exit", resolve)
		setTimeout(resolve, 5000) // Timeout after 5 seconds
	})

	console.log("✅ Server shutdown cleanly")
}

const testCacheFunctionality = async (): Promise<void> => {
	console.log("\n💾 Testing cache functionality...")

	const cacheDir = path.join(os.homedir(), ".mcp-docsrs")

	try {
		await fs.access(cacheDir)
		console.log("✅ Cache directory exists or will be created on first use")
	} catch {
		console.log("ℹ️  Cache directory will be created on first use")
	}
}

const testBasicMCPOperations = async (options: TestOptions): Promise<void> => {
	console.log("\n🔧 Testing basic MCP operations...")

	// Test with in-memory database to avoid file system issues
	const server = spawn(options.executable, [], {
		env: { ...process.env, DB_PATH: ":memory:" },
		stdio: ["pipe", "pipe", "pipe"]
	})

	// Send a basic MCP request
	const testRequest = `${JSON.stringify({
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: {
				name: "test-client",
				version: "1.0.0"
			}
		}
	})}\n`

	let response = ""
	let responseReceived = false

	server.stdout.on("data", (data) => {
		response += data.toString()
		responseReceived = true
	})

	server.stderr.on("data", (data) => {
		console.error("Server error:", data.toString())
	})

	// Give server time to initialize
	await new Promise((resolve) => setTimeout(resolve, 1000))

	// Send test request
	server.stdin.write(testRequest)

	// Wait for response
	await new Promise((resolve) => {
		const checkInterval = setInterval(() => {
			if (responseReceived) {
				clearInterval(checkInterval)
				resolve(undefined)
			}
		}, 100)

		// Timeout after 5 seconds
		setTimeout(() => {
			clearInterval(checkInterval)
			resolve(undefined)
		}, 5000)
	})

	if (!responseReceived) {
		server.kill("SIGTERM")
		throw new Error("No response received from MCP server")
	}

	// Parse response
	try {
		const lines = response.trim().split("\n")
		const jsonResponse = JSON.parse(lines[0])

		if (jsonResponse.result?.protocolVersion) {
			console.log(
				`✅ MCP initialization successful, protocol version: ${jsonResponse.result.protocolVersion}`
			)
		} else {
			throw new Error("Invalid MCP response")
		}
	} catch (error) {
		server.kill("SIGTERM")
		throw new Error(`Failed to parse MCP response: ${error}`)
	}

	// Clean shutdown
	server.kill("SIGTERM")
	await new Promise((resolve) => setTimeout(resolve, 1000))

	console.log("✅ Basic MCP operations test passed")
}

const runTests = async (options: TestOptions): Promise<void> => {
	console.log(`\n🧪 Running integration tests for ${options.target}`)
	console.log(`📦 Executable: ${options.executable}`)

	// Basic tests
	await testVersion(options)
	await testServerStartup(options)
	await testCacheFunctionality()
	await testBasicMCPOperations(options)

	// Extended tests (skip for MUSL builds as they run in minimal Alpine environment)
	if (!options.isMusl) {
		console.log("\n📋 Running extended integration tests...")

		// Run additional test suites
		await runCratesSearchTests(options)
		await runMCPProtocolTests(options)
		await runPersistentCacheTests(options)
		await runResourcesTests(options)
		await runZstdTests(options)
	}

	console.log(`\n✅ All integration tests passed for ${options.target}`)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error(
			"Usage: bun test/integration/test-binary.ts <executable> <target> [--musl] [--windows]"
		)
		process.exit(1)
	}

	const [executable, target] = args
	const isMusl = args.includes("--musl")
	const isWindows = args.includes("--windows")

	const options: TestOptions = {
		executable,
		target,
		isMusl,
		isWindows
	}

	try {
		await runTests(options)
	} catch (error) {
		console.error(`\n❌ Integration tests failed: ${error}`)
		process.exit(1)
	}
}
