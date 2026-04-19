// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture data uses upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../tests/fixtures/docs.ts"
import type { Item } from "../../docs/rustdoc/types/items.ts"
import { findSymbol, getFirstLine, getVisibility } from "./shared.ts"

const RECENT_CHILD_ID = 999_999
const SECOND_CHILD_ID = 202
const PREVIEW_SLICE_START = 97

describe("symbol shared helpers", () => {
	test("finds symbols even when the query includes extra path segments", () => {
		const json = createQueryJson()
		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "other::demo::runtime::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::runtime::Client")
	})

	test("handles queries that are longer than the indexed path", () => {
		const json = createQueryJson()
		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "too::many::segments::demo::runtime::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::runtime::Client")
	})

	test("handles recursive module graphs without looping", () => {
		const json = createQueryJson()
		if (typeof json.index["3"].inner === "object" && "module" in json.index["3"].inner) {
			json.index["3"].inner.module.items.push(0)
		}

		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::runtime::Client")
	})

	test("skips missing module children while building index paths", () => {
		const json = createQueryJson()
		if (typeof json.index["0"].inner === "object" && "module" in json.index["0"].inner) {
			json.index["0"].inner.module.items.push(RECENT_CHILD_ID)
		}

		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::runtime::Client")
	})

	test("handles mismatched path suffixes", () => {
		const json = createQueryJson()
		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "demo::runtime::Missing::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::runtime::Client")
	})

	test("uses derived paths when summary metadata is missing", () => {
		const json = createQueryJson()
		json.paths["2"] = undefined as never

		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "demo::Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.path).toBe("demo::Client")
	})

	test("orders competing symbol matches by score", () => {
		const json = createQueryJson()
		json.index["202"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "Secondary client",
			id: 202,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [],
					kind: {
						plain: {
							fields: [],
							has_stripped_fields: false
						}
					}
				}
			},
			links: {},
			name: "Client",
			span: null,
			visibility: "public"
		}
		if (typeof json.index["0"].inner === "object" && "module" in json.index["0"].inner) {
			json.index["0"].inner.module.items.push(SECOND_CHILD_ID)
		}

		const match = findSymbol(json, {
			crateName: "demo",
			symbolname: "Client",
			symbolType: "struct"
		})

		expect(match?.kind).toBe("struct")
		expect(match?.key).toBe("2")
	})

	test("returns null when no symbol matches", () => {
		expect(
			findSymbol(createQueryJson(), {
				crateName: "demo",
				symbolname: "missing::Thing",
				symbolType: "struct"
			})
		).toBeNull()
	})

	test("rejects unknown symbol kinds", () => {
		expect(
			findSymbol(createQueryJson(), {
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "unknown"
			})
		).toBeNull()
	})

	test("treats empty symbol names as no match", () => {
		expect(
			findSymbol(createQueryJson(), {
				crateName: "demo",
				symbolname: "",
				symbolType: "struct"
			})
		).toBeNull()
	})

	test("formats previews and visibility fallbacks", () => {
		const longLine =
			"The preview formatter intentionally trims this line because it is well beyond one hundred characters long."

		expect(getFirstLine(" first line \nsecond line")).toBe("first line")
		expect(getFirstLine(longLine)).toBe(`${longLine.slice(0, PREVIEW_SLICE_START)}...`)
		expect(
			getVisibility({
				visibility: "public"
			} as Item)
		).toBe("public")
		expect(
			getVisibility({
				visibility: undefined
			} as unknown as Item)
		).toBe("restricted")
	})
})
