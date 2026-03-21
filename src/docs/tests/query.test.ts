// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures and fallback items use upstream snake_case keys
// biome-ignore-all lint/style/noMagicNumbers: fallback rustdoc ids are intentional test fixtures
import { describe, expect, test } from "bun:test"
import { RustdocParseError } from "../../errors.ts"
import { lookupCrate, lookupCrateDocs, lookupSymbol } from "../query.ts"
import type { DocsSymbolRequest, RustdocJson } from "../types.ts"
import { createQueryJson } from "./fixtures.ts"

const target = {
	target_features: [],
	triple: "x86_64-unknown-linux-gnu"
}

const createLookupInput = (
	symbolType: string,
	symbolname: string,
	expandDocs = true
): DocsSymbolRequest => ({
	crateName: "demo",
	expandDocs,
	symbolname,
	symbolType
})

describe("query", () => {
	describe("lookupCrate", () => {
		test("creates crate overview", () => {
			const content = lookupCrate(createQueryJson())

			expect(content).toContain("# Crate: demo v1.2.3")
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
			expect(content).not.toContain("999")
		})

		test("throws missing root metadata", () => {
			const json = {
				crate_version: "1.0.0",
				external_crates: {},
				format_version: 57,
				includes_private: false,
				index: {},
				paths: {},
				target
			} as unknown as RustdocJson

			expect(() => lookupCrate(json)).toThrow(RustdocParseError)
		})

		test("throws missing root item", () => {
			const json: RustdocJson = {
				crate_version: "1.0.0",
				external_crates: {},
				format_version: 57,
				includes_private: false,
				index: {},
				paths: {},
				root: 42,
				target
			}

			expect(() => lookupCrate(json)).toThrow("Root item '42' not found in index")
		})

		test("returns crate docs without overview sections", () => {
			const content = lookupCrateDocs(createQueryJson())

			expect(content).toBe("Root crate docs")
		})
	})

	describe("lookupSymbol", () => {
		test("finds exact path match", () => {
			const content = lookupSymbol(createQueryJson(), createLookupInput("struct", "runtime::Client"))

			expect(content).toContain("# Client")
		})

		test("finds fallback path match", () => {
			const json = createQueryJson()
			const exact = lookupSymbol(json, createLookupInput("struct", "runtime::Client"))
			const fallback = lookupSymbol(json, createLookupInput("struct", "Client"))

			expect(fallback).toBe(exact)
		})

		test("finds raw index type alias match", () => {
			const content = lookupSymbol(createQueryJson(), createLookupInput("type", "Alias"))

			expect(content).toContain("# Alias")
			expect(content).toContain("**Type:** Type Alias")
		})

		test("uses index item kinds even when path metadata drifts", () => {
			const json = createQueryJson()
			json.paths["9"] = {
				crate_id: 0,
				kind: "macro",
				path: [
					"demo",
					"Alias"
				]
			}

			expect(lookupSymbol(json, createLookupInput("type", "Alias"))).toContain("**Type:** Type Alias")
		})

		test("falls back to index matches when path metadata is missing", () => {
			const json = createQueryJson()
			json.index["11"] = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 11,
				inner: {
					module: {
						is_crate: false,
						is_stripped: false,
						items: []
					}
				},
				links: {},
				name: "FallbackMod",
				span: null,
				visibility: "public"
			}
			json.index["12"] = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 12,
				inner: {
					struct: {
						generics: {
							params: [],
							where_predicates: []
						},
						impls: [],
						kind: "unit"
					}
				},
				links: {},
				name: "FallbackStruct",
				span: null,
				visibility: "public"
			}
			json.index["13"] = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 13,
				inner: {
					enum: {
						generics: {
							params: [],
							where_predicates: []
						},
						has_stripped_variants: false,
						impls: [],
						variants: []
					}
				},
				links: {},
				name: "FallbackEnum",
				span: null,
				visibility: "public"
			}
			json.index["14"] = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 14,
				inner: {
					function: {
						generics: {
							params: [],
							where_predicates: []
						},
						has_body: true,
						header: {
							abi: "rust",
							is_async: false,
							is_const: false,
							is_unsafe: false
						},
						sig: {
							inputs: [],
							is_c_variadic: false,
							output: null
						}
					}
				},
				links: {},
				name: "fallbackFn",
				span: null,
				visibility: "public"
			}
			json.index["15"] = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 15,
				inner: {
					trait: {
						bounds: [],
						generics: {
							params: [],
							where_predicates: []
						},
						implementations: [],
						is_auto: false,
						is_dyn_compatible: true,
						is_unsafe: false,
						items: []
					}
				},
				links: {},
				name: "FallbackTrait",
				span: null,
				visibility: "public"
			}

			expect(lookupSymbol(json, createLookupInput("module", "FallbackMod"))).toContain(
				"**Type:** Module"
			)
			expect(lookupSymbol(json, createLookupInput("struct", "FallbackStruct"))).toContain(
				"**Type:** Struct"
			)
			expect(lookupSymbol(json, createLookupInput("enum", "FallbackEnum"))).toContain(
				"**Type:** Enum"
			)
			expect(lookupSymbol(json, createLookupInput("fn", "fallbackFn"))).toContain(
				"**Type:** Function"
			)
			expect(lookupSymbol(json, createLookupInput("trait", "FallbackTrait"))).toContain(
				"**Type:** Trait"
			)
		})

		test("returns null for missing symbols and invalid kinds", () => {
			const json = createQueryJson()

			expect(lookupSymbol(json, createLookupInput("fn", "demo::connect::extra"))).toBeNull()
			expect(lookupSymbol(json, createLookupInput("struct", "other::Ghost"))).toBeNull()
			expect(lookupSymbol(json, createLookupInput("module", "FallbackMod"))).toBeNull()
			expect(lookupSymbol(json, createLookupInput("missing", "Client"))).toBeNull()
		})

		test("limits docs by default and expands them on demand", () => {
			const json = createQueryJson()
			json.index["2"] = {
				...json.index["2"],
				docs: Array.from(
					{
						length: 24
					},
					(_, index) => `Doc line ${index + 1}`
				).join("\n")
			}

			const preview = lookupSymbol(json, createLookupInput("struct", "runtime::Client", false))
			const expanded = lookupSymbol(json, createLookupInput("struct", "runtime::Client", true))

			expect(preview).toContain("Doc line 20")
			expect(preview).not.toContain("Doc line 21")
			expect(preview).toContain("Use `expandDocs: true` for more info.")
			expect(expanded).toContain("Doc line 24")
			expect(expanded).not.toContain("Use `expandDocs: true` for more info.")
		})
	})
})
