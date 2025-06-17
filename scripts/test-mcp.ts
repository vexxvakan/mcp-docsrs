#!/usr/bin/env bun

import { spawn } from "node:child_process"
import { createInterface } from "node:readline"

// Test the MCP server by sending JSON-RPC messages
async function testMCPServer() {
	console.log("Starting MCP server test...")

	// Spawn the server
	const server = spawn("./dist/mcp-docsrs", [], {
		stdio: ["pipe", "pipe", "pipe"]
	})

	// Create readline interfaces for stdout and stderr
	const stdoutReader = createInterface({
		input: server.stdout,
		crlfDelay: Number.POSITIVE_INFINITY
	})

	const stderrReader = createInterface({
		input: server.stderr,
		crlfDelay: Number.POSITIVE_INFINITY
	})

	// Handle server output
	stdoutReader.on("line", (line) => {
		try {
			const message = JSON.parse(line)
			console.log("Parsed message:", JSON.stringify(message, null, 2))
		} catch {
			console.log("Not JSON, just log it:", line)
		}
	})

	stderrReader.on("line", (line) => {
		console.log("Server stderr:", line)
	})

	// Handle errors
	server.on("error", (error) => {
		console.error("Server error:", error)
	})

	// Send initialize request
	const initRequest = {
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "1.0",
			capabilities: {
				tools: true
			}
		}
	}

	console.log("\nSending initialize request...")
	server.stdin.write(`${JSON.stringify(initRequest)}\n`)

	// Wait a bit for response
	await new Promise((resolve) => setTimeout(resolve, 1000))

	// Send list tools request
	const listToolsRequest = {
		jsonrpc: "2.0",
		id: 2,
		method: "tools/list",
		params: {}
	}

	console.log("\nSending tools/list request...")
	server.stdin.write(`${JSON.stringify(listToolsRequest)}\n`)

	// Wait a bit for response
	await new Promise((resolve) => setTimeout(resolve, 1000))

	// Test lookup_crate_docs tool
	const lookupCrateRequest = {
		jsonrpc: "2.0",
		id: 3,
		method: "tools/call",
		params: {
			name: "lookup_crate_docs",
			arguments: {
				crateName: "serde_json",
				version: "1.0.134"
			}
		}
	}

	console.log("\nSending lookup_crate_docs request...")
	server.stdin.write(`${JSON.stringify(lookupCrateRequest)}\n`)

	// Wait for response
	await new Promise((resolve) => setTimeout(resolve, 5000))

	// Clean shutdown
	console.log("\nSending shutdown signal...")
	server.kill("SIGTERM")

	// Wait for server to exit
	await new Promise((resolve) => {
		server.on("exit", (code, signal) => {
			console.log(`Server exited with code ${code} and signal ${signal}`)
			resolve(undefined)
		})
	})
}

// Run the test
testMCPServer().catch(console.error)
