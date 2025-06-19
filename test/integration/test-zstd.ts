#!/usr/bin/env bun
import {
	assertContains,
	assertSuccess,
	callTool,
	type TestOptions,
	withMCPServer
} from "./utils.js"

const testZstdDecompression = async (options: TestOptions): Promise<void> => {
	console.log("\n🗜️  Testing zstd decompression functionality...")

	await withMCPServer(options.executable, async (server) => {
		// Test 1: Fetch a crate that requires zstd decompression
		console.log("\n📦 Test 1: Fetch crate documentation with zstd compression...")

		// Using a popular crate that's likely to have compressed docs
		console.log("⏳ Fetching tokio documentation (this may take a moment)...")
		const startTime = Date.now()
		const lookupResponse = await callTool(server, "lookup_crate_docs", {
			crateName: "tokio",
			version: "1.40.0"
		})
		const fetchTime = Date.now() - startTime

		assertSuccess(lookupResponse)
		if (!lookupResponse.result?.content?.[0]?.text) {
			throw new Error("Failed to fetch crate documentation")
		}

		const docText = lookupResponse.result.content[0].text
		console.log(`✅ Successfully fetched and decompressed documentation in ${fetchTime}ms`)

		// Test 2: Verify decompressed content is valid
		console.log("\n🔍 Test 2: Verify decompressed content...")

		// Check for expected content in tokio docs
		const expectedPatterns = ["tokio", "async", "runtime", "spawn"]

		let foundPatterns = 0
		for (const pattern of expectedPatterns) {
			if (docText.toLowerCase().includes(pattern)) {
				foundPatterns++
			}
		}

		if (foundPatterns < 2) {
			throw new Error(
				"Decompressed content doesn't contain expected tokio documentation patterns"
			)
		}
		console.log(
			`✅ Verified documentation content (found ${foundPatterns}/${expectedPatterns.length} expected patterns)`
		)

		// Test 3: Fetch item documentation (also uses zstd)
		console.log("\n📄 Test 3: Fetch specific item documentation...")
		const itemResponse = await callTool(
			server,
			"lookup_item_docs",
			{
				crateName: "tokio",
				itemPath: "runtime",
				version: "1.40.0"
			},
			3
		)

		assertSuccess(itemResponse)
		if (!itemResponse.result?.content?.[0]?.text) {
			throw new Error("Failed to fetch item documentation")
		}

		const itemText = itemResponse.result.content[0].text
		assertContains(
			itemText.toLowerCase(),
			"runtime",
			"Item documentation should contain 'runtime'"
		)
		console.log("✅ Successfully fetched and decompressed item documentation")

		// Test 4: Test with a smaller crate to ensure zstd works for various sizes
		console.log("\n📐 Test 4: Test with smaller crate...")
		const smallCrateResponse = await callTool(
			server,
			"lookup_crate_docs",
			{
				crateName: "once_cell"
			},
			4
		)

		assertSuccess(smallCrateResponse)
		if (!smallCrateResponse.result?.content?.[0]?.text) {
			throw new Error("Failed to fetch small crate documentation")
		}

		const smallCrateText = smallCrateResponse.result.content[0].text
		if (!smallCrateText.includes("once_cell") && !smallCrateText.includes("OnceCell")) {
			throw new Error("Small crate documentation doesn't contain expected content")
		}
		console.log("✅ Zstd decompression works for crates of various sizes")

		console.log("\n✅ All zstd decompression tests passed")
	})
}

export const runZstdTests = async (options: TestOptions): Promise<void> => {
	await testZstdDecompression(options)
}

// Main execution
if (import.meta.main) {
	const args = process.argv.slice(2)

	if (args.length < 2) {
		console.error("Usage: bun test/integration/test-zstd.ts <executable> <target>")
		process.exit(1)
	}

	const [executable, target] = args
	const options: TestOptions = {
		executable,
		target
	}

	try {
		await runZstdTests(options)
	} catch (error) {
		console.error(`\n❌ Zstd decompression tests failed: ${error}`)
		process.exit(1)
	}
}
