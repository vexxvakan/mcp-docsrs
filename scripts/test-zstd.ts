#!/usr/bin/env bun
import { createDocsFetcher } from "../src/docs-fetcher.js"

async function testZstdDecompression() {
	console.log("Testing zstd decompression with tinc crate...")
	
	const fetcher = createDocsFetcher()
	
	try {
		const result = await fetcher.fetchCrateJson("tinc")
		console.log("Success! Got JSON data:")
		console.log("- Root:", result.root)
		console.log("- Crate version:", result.crate_version)
		console.log("- Number of items in index:", Object.keys(result.index).length)
		console.log("- First 200 chars:", JSON.stringify(result).substring(0, 200))
	} catch (error) {
		console.error("Error:", error)
		if (error.stack) {
			console.error("Stack:", error.stack)
		}
	} finally {
		fetcher.close()
	}
}

testZstdDecompression()