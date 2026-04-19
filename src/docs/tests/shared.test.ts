// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture data uses upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { createQueryJson } from "../../../tests/fixtures/docs.ts"
import type { Item } from "../rustdoc/types/items.ts"
import { ensureRoot, getItemById, getItemInnerTag, getKindFromItem, toIdKey } from "../shared.ts"

const ROOT_ITEM_ID = 999_999
const CLIENT_ITEM_ID = 2
const ID_KEY_SAMPLE = 42

describe("docs shared helpers", () => {
	test("looks up items and formats ids", () => {
		const json = createQueryJson()

		expect(toIdKey(ID_KEY_SAMPLE)).toBe("42")
		expect(getItemById(json, CLIENT_ITEM_ID)?.name).toBe("Client")
	})

	test.each([
		{
			message: "Invalid rustdoc JSON structure: missing root, index, or paths",
			mutate: (json: ReturnType<typeof createQueryJson>) => {
				json.root = undefined as never
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
				json.root = ROOT_ITEM_ID
			}
		}
	])("ensureRoot rejects invalid structures", ({ message, mutate }) => {
		const json = createQueryJson()
		mutate(json)

		expect(() => ensureRoot(json)).toThrow(message)
	})

	test("reads item kinds from tags and proc macros", () => {
		expect(getItemInnerTag({} as never)).toBeUndefined()
		expect(
			getItemInnerTag({
				module: {
					is_crate: false,
					is_stripped: false,
					items: []
				}
			})
		).toBe("module")
		expect(
			getItemInnerTag({
				proc_macro: {
					helpers: [],
					kind: "bang"
				}
			})
		).toBe("proc_macro")
		expect(
			getItemInnerTag({
				module: {}
			} as never)
		).toBe("module")
		const createItem = (inner: Item["inner"]) =>
			({
				attrs: [],
				crate_id: 0,
				deprecation: null,
				docs: null,
				id: 0 as never,
				inner,
				links: {},
				name: null,
				span: null,
				visibility: "public"
			}) as Item
		expect(getKindFromItem(createItem({} as never))).toBeUndefined()
		expect(getKindFromItem(createItem("proc_macro" as never))).toBeUndefined()
		expect(
			getKindFromItem(
				createItem({
					proc_macro: {
						helpers: [],
						kind: "attr"
					}
				} as never)
			)
		).toBe("proc_attribute")
		expect(
			getKindFromItem(
				createItem({
					proc_macro: {
						helpers: [],
						kind: "derive"
					}
				} as never)
			)
		).toBe("proc_derive")
		expect(
			getKindFromItem(
				createItem({
					proc_macro: {
						helpers: [],
						kind: "bang"
					}
				} as never)
			)
		).toBe("macro")
		expect(
			getKindFromItem(
				createItem({
					proc_macro: {
						helpers: [],
						kind: "unexpected" as never
					}
				} as never)
			)
		).toBeUndefined()
	})
})
