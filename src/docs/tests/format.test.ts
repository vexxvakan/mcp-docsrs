// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures use upstream snake_case keys
import { describe, expect, spyOn, test } from "bun:test"
import { ErrorLogger } from "../../errors.ts"
import { formatCrate } from "../formatters/crate.ts"
import { formatItem } from "../formatters/item.ts"
import { ensureRoot } from "../shared.ts"
import type { RustdocItem } from "../types.ts"
import { createQueryJson } from "./fixtures.ts"

const longDocs = Array.from(
	{
		length: 25
	},
	(_, index) => `Line ${index + 1}`
).join("\n")

describe("format", () => {
	describe("formatCrate", () => {
		test("creates crate output from prepared buckets", () => {
			const json = createQueryJson()
			const root = ensureRoot(json)
			const content = formatCrate(json, root, {
				enums: [
					"- **Mode**: Modes for the runtime"
				],
				functions: [
					"- **connect**: Connect to the backend"
				],
				modules: [
					"- **net**: Networking tools"
				],
				structs: [
					"- **Client**: Demo struct"
				],
				traits: [
					"- **Handler**: Handles requests"
				]
			})

			expect(content).toContain("# Crate: demo v1.2.3")
			expect(content).toContain("## Documentation\nRoot crate docs")
			expect(content).toContain("## Modules\n- **net**: Networking tools")
			expect(content).toContain("## Structs\n- **Client**: Demo struct")
			expect(content).toContain("## Enums\n- **Mode**: Modes for the runtime")
			expect(content).toContain("## Traits\n- **Handler**: Handles requests")
			expect(content).toContain("## Functions\n- **connect**: Connect to the backend")
		})

		test("omits empty sections", () => {
			const json = createQueryJson()
			const root = ensureRoot(json)
			const content = formatCrate(json, root, {
				enums: [],
				functions: [],
				modules: [],
				structs: [],
				traits: []
			})

			expect(content).toContain("# Crate: demo v1.2.3")
			expect(content).toContain("## Documentation\nRoot crate docs")
			expect(content).not.toContain("## Modules")
			expect(content).not.toContain("## Structs")
			expect(content).not.toContain("## Enums")
			expect(content).not.toContain("## Traits")
			expect(content).not.toContain("## Functions")
		})
	})

	describe("formatItem", () => {
		test("formats function details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["5"], "function")

			expect(content).toContain("# connect")
			expect(content).toContain("**Type:** Function")
			expect(content).toContain("**Attributes:** const, async, unsafe")
		})

		test("formats enum details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["3"], "enum")

			expect(content).toContain("# Mode")
			expect(content).toContain("**Type:** Enum")
			expect(content).toContain("**Variants:** 2")
			expect(content).toContain("**Implementations:** 1")
		})

		test("formats trait details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["4"], "trait")

			expect(content).toContain("# Handler")
			expect(content).toContain("**Type:** Trait")
			expect(content).toContain("**Attributes:** auto, unsafe, dyn compatible")
			expect(content).toContain("**Items:** 2")
		})

		test("formats implementation details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["7"], "impl")

			expect(content).toContain("# ClientImpl")
			expect(content).toContain("**Type:** Implementation")
			expect(content).toContain("**Trait:** demo::traits::Service")
			expect(content).toContain("**For:** demo::runtime::Client")
			expect(content).toContain("**Attributes:** negative, synthetic")
			expect(content).toContain("**Items:** 2")
			expect(content).toContain("**Provided Methods:** clone_default")
		})

		test("formats alias details", () => {
			const json = createQueryJson()
			const aliasContent = formatItem(json.index["20"], "type_alias")
			const assocTypeContent = formatItem(json.index["18"], "assoc_type")

			expect(aliasContent).toContain("**Generic Params:** 1")
			expect(aliasContent).toContain("**Where Clauses:** 1")
			expect(aliasContent).toContain("**Aliased Type:** core::result::Result")
			expect(assocTypeContent).toContain("**Bounds:** 1")
			expect(assocTypeContent).toContain("**Assigned Type:** std::string::String")
		})

		test("formats import and module details", () => {
			const json = createQueryJson()
			const moduleContent = formatItem(json.index["11"], "module")
			const useContent = formatItem(json.index["12"], "use")

			expect(moduleContent).toContain("**Items:** 2")
			expect(moduleContent).toContain("**Stripped:** yes")
			expect(useContent).toContain("**Source:** demo::runtime::Client")
			expect(useContent).toContain("**Import:** ClientAlias")
			expect(useContent).toContain("**Target Id:** 2")
		})

		test("formats constant and static details", () => {
			const json = createQueryJson()
			const constantContent = formatItem(json.index["16"], "constant")
			const assocConstContent = formatItem(json.index["17"], "assoc_const")
			const staticContent = formatItem(json.index["19"], "static")

			expect(constantContent).toContain("**Declared Type:** u32")
			expect(constantContent).toContain("**Value:** 42")
			expect(assocConstContent).toContain("**Declared Type:** usize")
			expect(assocConstContent).toContain("**Value:** 1024")
			expect(staticContent).toContain("**Declared Type:** u64")
			expect(staticContent).toContain("**Expression:** 30_000")
			expect(staticContent).toContain("**Attributes:** mutable")
		})

		test("formats proc macro helper details", () => {
			const json = createQueryJson()
			const deriveContent = formatItem(json.index["10"])
			const attrContent = formatItem(json.index["21"])

			expect(deriveContent).toContain("**Helpers:** default")
			expect(attrContent).toContain("**Helpers:** trace_skip")
		})

		test("formats union, variant, and struct field details", () => {
			const json = createQueryJson()
			const unionContent = formatItem(json.index["13"], "union")
			const variantContent = formatItem(json.index["14"], "variant")
			const fieldContent = formatItem(json.index["15"], "struct_field")

			expect(unionContent).toContain("**Generic Params:** 1")
			expect(unionContent).toContain("**Fields:** 2")
			expect(unionContent).toContain("**Implementations:** 1")
			expect(unionContent).toContain("**Stripped Fields:** yes")
			expect(variantContent).toContain("**Variant Type:** struct")
			expect(variantContent).toContain("**Fields:** 1")
			expect(variantContent).toContain("**Discriminant:** 1")
			expect(fieldContent).toContain("**Field Type:** std::string::String")
		})

		test("formats proc derive item details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["10"])

			expect(content).toContain("# Mystery")
			expect(content).toContain("**Type:** Proc Derive")
		})

		test("formats deprecated item details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index["10"])

			expect(content).toContain("# Mystery")
			expect(content).toContain("**Type:** Proc Derive")
			expect(content).toContain("**Visibility:** crate")
			expect(content).toContain("**Deprecated:** yes")
		})

		test("shows a documentation preview when docs expansion is disabled", () => {
			const item = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: longDocs,
				id: 997,
				inner: {
					module: {
						is_crate: false,
						is_stripped: false,
						items: []
					}
				},
				links: {},
				name: "PreviewedDocs",
				span: null,
				visibility: "public"
			} as RustdocItem

			const content = formatItem(item, "module", false)

			expect(content).toContain("## Documentation\nLine 1")
			expect(content).toContain("Line 20")
			expect(content).not.toContain("Line 21")
			expect(content).toContain("Use `expandDocs: true` for more info.")
		})

		test("shows full documentation when docs expansion is enabled", () => {
			const item = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: longDocs,
				id: 996,
				inner: {
					module: {
						is_crate: false,
						is_stripped: false,
						items: []
					}
				},
				links: {},
				name: "ExpandedDocs",
				span: null,
				visibility: "public"
			} as RustdocItem

			const content = formatItem(item, "module", true)

			expect(content).toContain("Line 25")
			expect(content).not.toContain("Use `expandDocs: true` for more info.")
		})

		test("ignores unsupported item kinds and warns", () => {
			const warnSpy = spyOn(ErrorLogger, "logWarning")
			const item = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: "Unknown item docs",
				id: 999,
				inner: {} as RustdocItem["inner"],
				links: {},
				name: "UnknownKind",
				span: null,
				visibility: "public"
			} as RustdocItem

			const content = formatItem(item)

			expect(content).toContain("# UnknownKind")
			expect(content).toContain("## Documentation\nUnknown item docs")
			expect(content).not.toContain("**Type:**")
			expect(warnSpy).toHaveBeenCalledWith("Ignoring unsupported rustdoc item kind", {
				itemId: 999,
				itemName: "UnknownKind"
			})
		})

		test("ignores unsupported inline value shapes and warns", () => {
			const warnSpy = spyOn(ErrorLogger, "logWarning")
			const item = {
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: "Alias docs",
				id: 998,
				inner: {
					type_alias: {
						generics: {
							params: [],
							where_predicates: []
						},
						type: {
							weird_shape: {
								deep: true
							}
						}
					}
				},
				links: {},
				name: "OddAlias",
				span: null,
				visibility: "public"
			} as RustdocItem

			const content = formatItem(item, "type_alias")

			expect(content).toContain("# OddAlias")
			expect(content).toContain("**Type:** Type Alias")
			expect(content).not.toContain("weird_shape")
			expect(content).not.toContain("**Aliased Type:**")
			expect(warnSpy).toHaveBeenCalledWith("Ignoring unsupported rustdoc formatter value", {
				field: "type_alias.type",
				itemId: 998,
				itemName: "OddAlias",
				value: {
					weird_shape: {
						deep: true
					}
				}
			})
		})
	})
})
