// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures and fallback items use upstream snake_case keys
// biome-ignore-all lint/style/noMagicNumbers: fallback rustdoc ids are intentional test fixtures
import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../tests/fixtures/docs.ts"
import { RustdocParseError } from "../../errors.ts"
import { lookupCrate, lookupCrateDocs, lookupSymbol } from "../query.ts"
import type { Crate } from "../rustdoc/types/items.ts"
import type { DocsSymbolRequest } from "../types.ts"

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

const getSection = (json: ReturnType<typeof lookupCrate>, kind: string) =>
	json.sections.find((section) => section.kind === kind)

describe("lookupCrate", () => {
	test("creates structured crate overview", () => {
		const result = lookupCrate(createQueryJson())
		const modules = getSection(result, "module")
		const structs = getSection(result, "struct")

		expect(result.crateName).toBe("demo")
		expect(result.crateVersion).toBe("1.2.3")
		expect(result.formatVersion).toBe(57)
		expect(result.summary).toBe("Root crate docs")
		expect(result.target).toBe("x86_64-unknown-linux-gnu")
		expect(result.totalItems).toBe(6)
		expect(result.sections.map((section) => section.kind)).toEqual([
			"module",
			"struct",
			"enum",
			"trait",
			"function"
		])
		expect(modules).toEqual({
			count: 1,
			items: [
				{
					name: "net",
					path: "demo::net",
					summary: "Networking tools"
				}
			],
			kind: "module",
			label: "Modules"
		})
		expect(structs?.items).toContainEqual({
			name: "Client",
			path: "demo::runtime::Client",
			summary:
				"This summary line is intentionally longer than one hundred characters so the preview formatter ha..."
		})
		expect(structs?.items).toContainEqual({
			name: "unknown",
			path: "demo",
			summary: "Anonymous but public"
		})
	})

	test("creates structured crate overview for expanded rustdoc kinds", () => {
		const json = createQueryJson()
		const root = json.index["0"]
		if (typeof root.inner === "string" || !("module" in root.inner)) {
			throw new Error("Expected module root fixture")
		}

		json.index["10"].visibility = "public"
		root.inner.module.items.push(9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21)

		const result = lookupCrate(json)

		expect(getSection(result, "type_alias")?.items).toEqual([
			{
				name: "Alias",
				path: "demo::Alias",
				summary: "Shared alias"
			},
			{
				name: "ResultAlias",
				path: "demo::ResultAlias",
				summary: "Result alias"
			}
		])
		expect(getSection(result, "proc_derive")?.items).toContainEqual({
			name: "Mystery",
			path: "demo::Mystery",
			summary: "Mysterious item docs"
		})
		expect(getSection(result, "proc_attribute")?.items).toContainEqual({
			name: "trace",
			path: "demo::trace",
			summary: "Tracing attribute"
		})
		expect(getSection(result, "union")?.items).toContainEqual({
			name: "Payload",
			path: "demo::Payload",
			summary: "Union payload"
		})
		expect(getSection(result, "variant")?.items).toContainEqual({
			name: "Ready",
			path: "demo::Ready",
			summary: "Ready state variant"
		})
		expect(getSection(result, "constant")?.items).toContainEqual({
			name: "MAX_RETRIES",
			path: "demo::MAX_RETRIES",
			summary: "Retry count"
		})
		expect(getSection(result, "assoc_const")?.items).toContainEqual({
			name: "BUF_SIZE",
			path: "demo::BUF_SIZE",
			summary: "Buffer size"
		})
		expect(getSection(result, "assoc_type")?.items).toContainEqual({
			name: "Output",
			path: "demo::Output",
			summary: "Associated output type"
		})
		expect(getSection(result, "static")?.items).toContainEqual({
			name: "DEFAULT_TIMEOUT",
			path: "demo::DEFAULT_TIMEOUT",
			summary: "Default timeout"
		})
		expect(getSection(result, "use")?.items).toContainEqual({
			name: "ClientAlias",
			path: "demo::ClientAlias",
			summary: "Re-exported client"
		})
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
		} as unknown as Crate

		expect(() => lookupCrate(json)).toThrow(RustdocParseError)
	})

	test("throws missing root item", () => {
		const json: Crate = {
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
