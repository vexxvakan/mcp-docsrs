import { describe, expect, it } from "bun:test"
import { RustdocParseError } from "../../src/errors.js"
import { findItem, parseCrateInfo } from "../../src/rustdoc-parser.js"
import type { RustdocJson } from "../../src/types.js"

describe("RustdocParser", () => {
	// Sample rustdoc JSON structure for testing
	const sampleJson: RustdocJson = {
		format_version: 30,
		root: "0:0",
		crate_version: "1.0.0",
		includes_private: false,
		index: {
			"0:0": {
				id: "0:0",
				crate_id: 0,
				name: "test_crate",
				visibility: "public" as const,
				docs: "This is a test crate for demonstration purposes.",
				inner: {
					module: {
						is_crate: true,
						items: ["0:1", "0:2"]
					}
				}
			},
			"0:1": {
				id: "0:1",
				crate_id: 0,
				name: "MyStruct",
				visibility: "public" as const,
				docs: "A sample struct",
				inner: {
					struct: {
						struct_type: "plain",
						fields: []
					}
				}
			},
			"0:2": {
				id: "0:2",
				crate_id: 0,
				name: "my_function",
				visibility: "public" as const,
				docs: "A sample function that does something",
				inner: {
					function: {
						decl: {},
						header: {
							const: false,
							async: false,
							unsafe: false
						}
					}
				}
			}
		},
		paths: {
			"0:1": {
				crate_id: 0,
				path: ["test_crate", "MyStruct"],
				kind: "struct"
			},
			"0:2": {
				crate_id: 0,
				path: ["test_crate", "my_function"],
				kind: "function"
			}
		},
		external_crates: {}
	}

	describe("parseCrateInfo", () => {
		it("should parse crate information correctly", () => {
			const result = parseCrateInfo(sampleJson)

			expect(result).toContain("# Crate: test_crate v1.0.0")
			expect(result).toContain("## Documentation")
			expect(result).toContain("This is a test crate for demonstration purposes.")
			expect(result).toContain("## Structs")
			expect(result).toContain("- **MyStruct**: A sample struct")
			expect(result).toContain("## Functions")
			expect(result).toContain("- **my_function**: A sample function that does something")
		})

		it("should handle missing root item", () => {
			const emptyJson: RustdocJson = {
				format_version: 30,
				root: "invalid",
				includes_private: false,
				index: {},
				paths: {},
				external_crates: {}
			}

			expect(() => parseCrateInfo(emptyJson)).toThrow(RustdocParseError)
			expect(() => parseCrateInfo(emptyJson)).toThrow("Root item 'invalid' not found in index")
		})
	})

	describe("findItem", () => {
		it("should find items by path", () => {
			const result = findItem(sampleJson, "MyStruct")

			expect(result).toContain("# MyStruct")
			expect(result).toContain("**Type:** struct")
			expect(result).toContain("A sample struct")
		})

		it("should find items by partial path", () => {
			const result = findItem(sampleJson, "my_function")

			expect(result).toContain("# my_function")
			expect(result).toContain("**Type:** function")
			expect(result).toContain("A sample function that does something")
		})

		it("should return null for non-existent items", () => {
			const result = findItem(sampleJson, "NonExistent")
			expect(result).toBeNull()
		})

		it("should handle struct details", () => {
			const structJson = {
				...sampleJson,
				index: {
					...sampleJson.index,
					"0:1": {
						...sampleJson.index["0:1"],
						inner: {
							struct: {
								struct_type: "tuple" as const,
								fields: ["0:3", "0:4"],
								impls: ["0:5"]
							}
						}
					}
				}
			}

			const result = findItem(structJson, "MyStruct")

			expect(result).toContain("**Struct Type:** tuple")
			expect(result).toContain("**Fields:** (field IDs available")
			expect(result).toContain("**Implementations:** 1 impl block(s)")
		})
	})
})
