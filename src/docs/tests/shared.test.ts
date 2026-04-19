// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture data uses upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../tests/fixtures/docs.ts"
import type { Item } from "../rustdoc/types/items.ts"
import { ensureRoot, getItemById, getItemInnerTag, getKindFromItem, toIdKey } from "../shared.ts"

describe("docs shared helpers", () => {
	test("looks up items and formats ids", () => {
		const json = createQueryJson()

		expect(toIdKey(42)).toBe("42")
		expect(getItemById(json, 2)?.name).toBe("Client")
	})

	test.each([
		{
			message: "Invalid rustdoc JSON structure: missing root, index, or paths",
			mutate: (json: ReturnType<typeof createQueryJson>) => {
				json.root = undefined
			}
		},
		{
			message: "Invalid rustdoc JSON structure: missing root, index, or paths",
			mutate: (json: ReturnType<typeof createQueryJson>) => {
				json.index = undefined as never
			}
		},
		{
			message: "Invalid rustdoc JSON structure: missing root, index, or paths",
			mutate: (json: ReturnType<typeof createQueryJson>) => {
				json.paths = undefined as never
			}
		},
		{
			message: "Root item '999999' not found in index",
			mutate: (json: ReturnType<typeof createQueryJson>) => {
				json.root = 999_999
			}
		}
	])("ensureRoot rejects invalid structures", ({ message, mutate }) => {
		const json = createQueryJson()
		mutate(json)

		expect(() => ensureRoot(json)).toThrow(message)
	})

	test("reads item kinds from tags and proc macros", () => {
		expect(getItemInnerTag({} as Item)).toBeUndefined()
		expect(getItemInnerTag("module")).toBe("module")
		expect(
			getItemInnerTag({
				proc_macro: {
					kind: "bang"
				}
			} as never)
		).toBe("proc_macro")
		expect(
			getItemInnerTag({
				module: {}
			} as never)
		).toBe("module")
		expect(
			getKindFromItem({
				inner: {}
			} as Item)
		).toBeUndefined()
		expect(
			getKindFromItem({
				inner: "proc_macro"
			} as Item)
		).toBeUndefined()
		expect(
			getKindFromItem({
				inner: {
					proc_macro: {
						helpers: [],
						kind: "attr"
					}
				}
			} as Item)
		).toBe("proc_attribute")
		expect(
			getKindFromItem({
				inner: {
					proc_macro: {
						helpers: [],
						kind: "derive"
					}
				}
			} as Item)
		).toBe("proc_derive")
		expect(
			getKindFromItem({
				inner: {
					proc_macro: {
						helpers: [],
						kind: "bang"
					}
				}
			} as Item)
		).toBe("macro")
		expect(
			getKindFromItem({
				inner: {
					proc_macro: {
						helpers: [],
						kind: "unexpected" as never
					}
				}
			} as Item)
		).toBeUndefined()
	})
})
