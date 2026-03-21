// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures and fallback items use upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { RustdocParseError } from "../../errors.ts"
import { lookupCrate, lookupItem } from "../query.ts"
import type { RustdocJson } from "../types.ts"
import { createQueryJson } from "./fixtures.ts"

describe("query", () => {
	describe("lookupCrate", () => {
		test("creates crate overview", () => {
			const content = lookupCrate(createQueryJson())

			expect(content).toContain("# Crate: demo v1.2.3")
			expect(content).toContain("## Documentation\nRoot crate docs")
			expect(content).toContain("## Modules\n- **net**: Networking tools")
			expect(content).toContain("## Structs")
			expect(content).toContain(
				"- **Client**: This summary line is intentionally longer than one hundred characters so the preview formatter ha..."
			)
			expect(content).toContain("- **unknown**: Anonymous but public")
			expect(content).toContain("## Enums\n- **Mode**: Modes for the runtime")
			expect(content).toContain("## Traits\n- **Handler**: Handles requests")
			expect(content).toContain("## Functions\n- **connect**: Connect to the backend")
			expect(content).not.toContain("hidden")
			expect(content).not.toContain("missing_item")
		})

		test("throws missing root metadata", () => {
			const json = {
				crate_version: "1.0.0",
				external_crates: {},
				format_version: 43,
				includes_private: false,
				index: {},
				paths: {}
			} as RustdocJson

			expect(() => lookupCrate(json)).toThrow(RustdocParseError)
		})

		test("throws missing root item", () => {
			const json: RustdocJson = {
				crate_version: "1.0.0",
				external_crates: {},
				format_version: 43,
				includes_private: false,
				index: {},
				paths: {},
				root: "missing"
			}

			expect(() => lookupCrate(json)).toThrow("Root item 'missing' not found in index")
		})
	})

	describe("lookupItem", () => {
		test("finds exact path match", () => {
			const content = lookupItem(createQueryJson(), "struct.runtime::Client")

			expect(content).toContain("# Client")
		})

		test("finds fallback path match", () => {
			const json = createQueryJson()
			const exact = lookupItem(json, "struct.runtime::Client")
			const fallback = lookupItem(json, "struct.Client")

			expect(fallback).toBe(exact)
		})

		test("finds raw index name match", () => {
			const content = lookupItem(createQueryJson(), "type.Alias")

			expect(content).toContain("# Alias")
		})

		test("falls back to index matches when path metadata is missing", () => {
			const json = createQueryJson()
			json.index.module_fallback = {
				crate_id: 0,
				id: "module_fallback",
				inner: {
					module: {
						is_crate: false,
						items: []
					}
				},
				name: "FallbackMod",
				visibility: "public"
			}
			json.index.struct_fallback = {
				crate_id: 0,
				id: "struct_fallback",
				inner: {
					struct: {
						struct_type: "tuple"
					}
				},
				name: "FallbackStruct",
				visibility: "public"
			}
			json.index.enum_fallback = {
				crate_id: 0,
				id: "enum_fallback",
				inner: {
					enum: {}
				},
				name: "FallbackEnum",
				visibility: "public"
			}
			json.index.function_fallback = {
				crate_id: 0,
				id: "function_fallback",
				inner: {
					function: {
						decl: {}
					}
				},
				name: "fallbackFn",
				visibility: "public"
			}
			json.index.trait_fallback = {
				crate_id: 0,
				id: "trait_fallback",
				inner: {
					trait: {
						is_auto: false,
						is_unsafe: false,
						items: []
					}
				},
				name: "FallbackTrait",
				visibility: "public"
			}

			expect(lookupItem(json, "module.FallbackMod")).toContain("**Type:** Module")
			expect(lookupItem(json, "struct.FallbackStruct")).toContain("**Type:** Struct")
			expect(lookupItem(json, "enum.FallbackEnum")).toContain("**Type:** Enum")
			expect(lookupItem(json, "fn.fallbackFn")).toContain("**Type:** Function")
			expect(lookupItem(json, "trait.FallbackTrait")).toContain("**Type:** Trait")
		})

		test("returns null for missing symbols", () => {
			const json = createQueryJson()

			expect(lookupItem(json, "fn.demo::connect::extra")).toBeNull()
			expect(lookupItem(json, "struct.other::Ghost")).toBeNull()
			expect(lookupItem(json, "module.FallbackMod")).toBeNull()
			expect(lookupItem(json, "Missing")).toBeNull()
		})
	})
})
