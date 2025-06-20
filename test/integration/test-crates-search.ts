#!/usr/bin/env bun
import { assertContains, callTool, type TestOptions, withMCPServer } from "./utils"

const testCratesSearch = async (options: TestOptions): Promise<void> => {
	console.log("\n🔍 Testing crates search functionality...")

	await withMCPServer(options.executable, async (server) => {
		// Test 1: Search for popular crate
		console.log("\n📦 Test 1: Searching for 'tinc'...")
		const tincResponse = await callTool(
			server,
			"search_crates",
			{
				query: "tinc",
				limit: 5
			},
			2
		)

		const tincText = tincResponse.result?.content?.[0]?.text || ""
		assertContains(tincText, "tinc", "Should find tinc crate")
		console.log("✅ Found tinc crate")

		// Test 2: Partial match search
		console.log("\n📦 Test 2: Partial match search for 'tokio'...")
		const partialResponse = await callTool(
			server,
			"search_crates",
			{
				query: "tokio",
				limit: 10
			},
			3
		)

		const partialText = partialResponse.result?.content?.[0]?.text || ""
		assertContains(partialText, "tokio", "Should find tokio crate")
		console.log("✅ Found tokio crate")

		// Test 3: Non-existent crate
		console.log("\n📦 Test 3: Searching for non-existent crate...")
		const nonExistentResponse = await callTool(
			server,
			"search_crates",
			{
				query: "this-crate-definitely-does-not-exist-12345",
				limit: 5
			},
			4
		)

		const nonExistentText = nonExistentResponse.result?.content?.[0]?.text || ""
		assertContains(nonExistentText, "No crates found", "Should report no crates found")
		console.log("✅ Correctly handled non-existent crate")

		// Test 4: Special characters
		console.log("\n📦 Test 4: Searching with special characters...")
		const specialResponse = await callTool(
			server,
			"search_crates",
			{
				query: "clap-derive",
				limit: 5
			},
			5
		)

		const specialText = specialResponse.result?.content?.[0]?.text || ""
		if (!specialText.includes("clap_derive") && !specialText.includes("clap-derive")) {
			throw new Error("Should handle hyphenated names")
		}
		console.log("✅ Special characters handled correctly")

		console.log("\n✅ All crates search tests passed")
	})
}

export const runCratesSearchTests = async (options: TestOptions): Promise<void> => {
	await testCratesSearch(options)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error("Usage: bun test/integration/test-crates-search.ts <executable> <target>")
		process.exit(1)
	}

	const [executable, target] = args
	const options: TestOptions = { executable, target }

	try {
		await runCratesSearchTests(options)
	} catch (error) {
		console.error(`\n❌ Crates search tests failed: ${error}`)
		process.exit(1)
	}
}
