#!/usr/bin/env bun
import {
	assertContains,
	assertError,
	assertSuccess,
	callTool,
	createMCPServer,
	initializeServer,
	listTools,
	type TestOptions
} from "./utils"

const testMCPProtocol = async (options: TestOptions): Promise<void> => {
	console.log("\n🔧 Testing MCP protocol implementation...")

	const server = createMCPServer(options.executable)

	try {
		// Test 1: Initialize
		console.log("\n📡 Test 1: MCP Initialize...")
		await initializeServer(server)
		console.log("✅ Initialized successfully")

		// Test 2: List tools
		console.log("\n🛠️  Test 2: List available tools...")
		const tools = await listTools(server, 2)

		const expectedTools = ["lookup_crate_docs", "lookup_item_docs", "search_crates"]
		for (const toolName of expectedTools) {
			if (!tools.includes(toolName)) {
				throw new Error(`Missing expected tool: ${toolName}`)
			}
		}
		console.log(`✅ Found all ${tools.length} expected tools`)

		// Test 3: Tool invocation - lookup_crate_docs
		console.log("\n📚 Test 3: Tool invocation - lookup_crate_docs...")
		const lookupResponse = await callTool(
			server,
			"lookup_crate_docs",
			{
				crateName: "clap"
			},
			3
		)

		assertSuccess(lookupResponse, "Failed to lookup crate documentation")
		const docText = lookupResponse.result.content[0].text
		assertContains(docText, "clap", "Documentation should contain crate name")
		console.log("✅ Successfully retrieved crate documentation")

		// Test 4: Error handling - invalid tool
		console.log("\n❌ Test 4: Error handling - invalid tool...")
		const invalidToolResponse = await server.sendRequest({
			jsonrpc: "2.0",
			id: 4,
			method: "tools/call",
			params: {
				name: "invalid_tool_name",
				arguments: {}
			}
		})

		assertError(invalidToolResponse, "Should have returned an error for invalid tool")
		console.log("✅ Correctly handled invalid tool request")

		// Test 5: Error handling - missing arguments
		console.log("\n❌ Test 5: Error handling - missing arguments...")
		const missingArgsResponse = await server.sendRequest({
			jsonrpc: "2.0",
			id: 5,
			method: "tools/call",
			params: {
				name: "lookup_crate_docs",
				arguments: {}
			}
		})

		assertError(missingArgsResponse, "Should have returned an error for missing arguments")
		console.log("✅ Correctly handled missing arguments")

		console.log("\n✅ All MCP protocol tests passed")
	} finally {
		server.kill()
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
}

export const runMCPProtocolTests = async (options: TestOptions): Promise<void> => {
	await testMCPProtocol(options)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error("Usage: bun test/integration/test-mcp-protocol.ts <executable> <target>")
		process.exit(1)
	}

	const [executable, target] = args
	const options: TestOptions = { executable, target }

	try {
		await runMCPProtocolTests(options)
	} catch (error) {
		console.error(`\n❌ MCP protocol tests failed: ${error}`)
		process.exit(1)
	}
}
