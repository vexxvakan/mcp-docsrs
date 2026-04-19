// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture objects use upstream snake_case keys
import { describe, expect, test } from "bun:test"
import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import { createQueryJson } from "../../../../tests/fixtures/docs.ts"
import {
	createEnumLookupJson,
	createModuleLookupJson,
	createStructLookupJson
} from "../../../../tests/fixtures/symbol-lookup.ts"
import { lookupSymbolItems } from "./details.ts"
import { createLookupSymbolHandler } from "./handler.ts"

const createFetcher = (overrides: Partial<DocsFetcher> = {}): DocsFetcher => ({
	clearCache: () => undefined,
	close: () => undefined,
	load: async () => ({
		data: createQueryJson(),
		fromCache: true
	}),
	...overrides
})

const getText = (value: Awaited<ReturnType<ReturnType<typeof createLookupSymbolHandler>>>) =>
	value.content[0]?.type === "text" ? value.content[0].text : ""

describe("createLookupSymbolHandler", () => {
	test("returns structured symbol overview", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: async () => ({
					data: createStructLookupJson(),
					fromCache: true
				})
			})
		)({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(getText(result)).toBe(
			"Retrieved overview for struct demo::runtime::Client from demo v1.2.3."
		)
		expect(result.structuredContent).toEqual({
			crateName: "demo",
			crateVersion: "1.2.3",
			formatVersion: 57,
			items: {
				autoTraits: {
					"demo::traits::AutoService": "Auto implementation"
				},
				blankets: {
					"demo::traits::Blanket": "Blanket implementation"
				},
				fields: {
					config: "Configuration field",
					state: "State field"
				},
				traits: {
					"demo::traits::Service": "Implementation details"
				}
			},
			symbol: {
				deprecated: false,
				hasDocs: true,
				kind: "struct",
				label: "Struct",
				name: "Client",
				path: "demo::runtime::Client",
				summary:
					"This summary line is intentionally longer than one hundred characters so the preview formatter ha...",
				visibility: "public"
			},
			target: "x86_64-unknown-linux-gnu"
		})
	})

	test("returns enum items", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: async () => ({
					data: createEnumLookupJson(),
					fromCache: true
				})
			})
		)({
			crateName: "demo",
			symbolname: "Mode",
			symbolType: "enum"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			items: {
				autoTraits: {
					"demo::traits::ModeAuto": "Mode auto implementation"
				},
				blankets: {
					"demo::traits::ModeBlanket": "Mode blanket implementation"
				},
				traits: {
					"demo::traits::ModeTrait": "Mode trait implementation"
				},
				variants: {
					Busy: "Busy variant",
					Ready: "Ready variant"
				}
			},
			symbol: {
				kind: "enum",
				name: "Mode"
			}
		})
	})

	test("returns module items", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: async () => ({
					data: createModuleLookupJson(),
					fromCache: true
				})
			})
		)({
			crateName: "demo",
			symbolname: "demo",
			symbolType: "module"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			items: {
				enums: {
					Mode: "Modes for the runtime"
				},
				functions: {
					connect: "Connect to the backend"
				},
				modules: {
					net: "Networking tools"
				},
				reexports: {
					ClientAlias: "Re-exported client"
				},
				structs: {
					Client:
						"This summary line is intentionally longer than one hundred characters so the preview formatter ha..."
				}
			},
			symbol: {
				kind: "module",
				name: "demo"
			}
		})
	})

	test("falls back to short symbol paths", async () => {
		const result = await createLookupSymbolHandler(createFetcher())({
			crateName: "demo",
			symbolname: "Client",
			symbolType: "struct"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			symbol: {
				kind: "struct",
				name: "Client",
				path: "demo::runtime::Client"
			}
		})
	})

	test("uses raw item kinds even when path metadata drifts", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.paths["9"] = {
						crate_id: 0,
						kind: "macro",
						path: [
							"demo",
							"Alias"
						]
					}
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo",
			symbolname: "Alias",
			symbolType: "type"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			symbol: {
				kind: "type_alias",
				label: "Type Alias",
				name: "Alias"
			}
		})
	})

	test("handles unit and tuple structs plus malformed item shapes", () => {
		const json = createQueryJson()
		json.index["101"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "Tuple field",
			id: 101,
			inner: {
				struct_field: {
					primitive: "u32"
				}
			},
			links: {},
			name: "tupleField",
			span: null,
			visibility: "public"
		}
		json.index["30"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 30,
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
			name: "UnitThing",
			span: null,
			visibility: "public"
		}
		json.index["31"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 31,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [],
					kind: {
						tuple: [
							101
						]
					}
				}
			},
			links: {},
			name: "TupleThing",
			span: null,
			visibility: "public"
		}
		json.index["32"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 32,
			inner: "module",
			links: {},
			name: "StringModule",
			span: null,
			visibility: "public"
		}
		json.index["33"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 33,
			inner: "struct",
			links: {},
			name: "StringStruct",
			span: null,
			visibility: "public"
		}

		expect(lookupSymbolItems(json, json.index["30"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {},
			traits: {}
		})
		expect(lookupSymbolItems(json, json.index["31"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {
				tupleField: "Tuple field"
			},
			traits: {}
		})
		expect(lookupSymbolItems(json, json.index["32"])).toBeUndefined()
		expect(lookupSymbolItems(json, json.index["33"])).toBeUndefined()
	})

	test("uses path and id fallbacks for unnamed struct fields", () => {
		const json = createQueryJson()
		json.index["101"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 101,
			inner: {
				struct_field: {
					primitive: "u32"
				}
			},
			links: {},
			name: null,
			span: null,
			visibility: "public"
		}
		json.index["102"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "Detailed fallback docs",
			id: 102,
			inner: {
				struct_field: {
					primitive: "u64"
				}
			},
			links: {},
			name: null,
			span: null,
			visibility: "public"
		}
		json.index["30"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 30,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [],
					kind: {
						plain: {
							fields: [
								101,
								102
							]
						}
					}
				}
			},
			links: {},
			name: "FallbackThing",
			span: null,
			visibility: "public"
		}
		json.paths["101"] = {
			crate_id: 0,
			kind: "struct_field",
			path: [
				"demo",
				"runtime",
				"namedField"
			]
		}

		expect(lookupSymbolItems(json, json.index["30"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {
				"102": "Detailed fallback docs",
				namedField: "Struct Field"
			},
			traits: {}
		})
	})

	test("keeps the first value when struct field keys collide", () => {
		const json = createQueryJson()
		json.index["101"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "First value",
			id: 101,
			inner: {
				struct_field: {
					primitive: "u32"
				}
			},
			links: {},
			name: null,
			span: null,
			visibility: "public"
		}
		json.index["102"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "Second value",
			id: 102,
			inner: {
				struct_field: {
					primitive: "u64"
				}
			},
			links: {},
			name: null,
			span: null,
			visibility: "public"
		}
		json.index["30"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 30,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [],
					kind: {
						plain: {
							fields: [
								101,
								102
							]
						}
					}
				}
			},
			links: {},
			name: "CollisionThing",
			span: null,
			visibility: "public"
		}
		json.paths["101"] = {
			crate_id: 0,
			kind: "struct_field",
			path: [
				"demo",
				"runtime",
				"duplicate"
			]
		}
		json.paths["102"] = {
			crate_id: 0,
			kind: "struct_field",
			path: [
				"demo",
				"runtime",
				"duplicate"
			]
		}

		expect(lookupSymbolItems(json, json.index["30"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {
				duplicate: "First value"
			},
			traits: {}
		})
	})

	test("skips impls that do not point at a trait", () => {
		const json = createQueryJson()
		json.index["41"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 41,
			inner: {
				impl: {
					blanket_impl: null,
					for_: {
						primitive: "u32"
					},
					generics: {
						params: [],
						where_predicates: []
					},
					negative: false,
					trait: null
				}
			},
			links: {},
			name: "IgnoredImpl",
			span: null,
			visibility: "public"
		}
		json.index["40"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 40,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [
						41
					],
					kind: "unit"
				}
			},
			links: {},
			name: "NoTraitImpl",
			span: null,
			visibility: "public"
		}

		expect(lookupSymbolItems(json, json.index["40"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {},
			traits: {}
		})
	})

	test("uses the traits bucket when impl trait metadata is missing", () => {
		const json = createQueryJson()
		json.index["41"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: "Fallback implementation",
			id: 41,
			inner: {
				impl: {
					blanket_impl: null,
					for: {
						primitive: "u32"
					},
					generics: {
						params: [],
						where_predicates: []
					},
					is_negative: false,
					is_synthetic: false,
					is_unsafe: false,
					items: [],
					provided_trait_methods: [],
					trait: {
						args: null,
						id: 999_999,
						path: "demo::traits::Missing"
					}
				}
			},
			links: {},
			name: "FallbackImpl",
			span: null,
			visibility: "public"
		}
		json.index["40"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 40,
			inner: {
				struct: {
					generics: {
						params: [],
						where_predicates: []
					},
					impls: [
						41
					],
					kind: "unit"
				}
			},
			links: {},
			name: "MissingTraitImpl",
			span: null,
			visibility: "public"
		}

		expect(lookupSymbolItems(json, json.index["40"])).toEqual({
			autoTraits: {},
			blankets: {},
			fields: {},
			traits: {
				"demo::traits::Missing": "Fallback implementation"
			}
		})
	})

	test("returns undefined for malformed enum items", () => {
		const json = createQueryJson()
		json.index["30"] = {
			attrs: [],
			crate_id: 0,
			deprecation: null,
			docs: null,
			id: 30,
			inner: "enum",
			links: {},
			name: "BrokenEnum",
			span: null,
			visibility: "public"
		}

		expect(lookupSymbolItems(json, json.index["30"])).toBeUndefined()
	})

	test("uses the implementation fallback text when docs are missing", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: async () => {
					const data = createStructLookupJson()
					data.index["23"].docs = null
					return {
						data,
						fromCache: true
					}
				}
			})
		)({
			crateName: "demo",
			symbolname: "runtime::Client",
			symbolType: "struct"
		})

		expect(result.structuredContent).toMatchObject({
			items: {
				blankets: {
					"demo::traits::Blanket": "Implementation"
				}
			}
		})
	})

	test("ignores missing module children in structured output", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: () => {
					const data = createModuleLookupJson()
					if (typeof data.index["0"].inner === "object" && "module" in data.index["0"].inner) {
						data.index["0"].inner.module.items.push(9999)
					}
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo",
			symbolname: "demo",
			symbolType: "module"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			items: {
				modules: {
					net: "Networking tools"
				}
			}
		})
	})

	test("falls back to index matches when path metadata is missing", async () => {
		const result = await createLookupSymbolHandler(
			createFetcher({
				load: () => {
					const data = createQueryJson()
					data.index["11"] = {
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
					return Promise.resolve({
						data,
						fromCache: true
					})
				}
			})
		)({
			crateName: "demo",
			symbolname: "FallbackMod",
			symbolType: "module"
		})

		expect(result.isError ?? false).toBeFalse()
		expect(result.structuredContent).toMatchObject({
			items: {
				enums: {},
				functions: {},
				modules: {},
				reexports: {},
				structs: {}
			},
			symbol: {
				kind: "module",
				name: "FallbackMod",
				visibility: "public"
			}
		})
	})

	test.each([
		[
			"missing",
			createFetcher(),
			{
				crateName: "demo",
				symbolname: "other::Ghost",
				symbolType: "struct"
			},
			"Error: Item 'struct.other::Ghost' not found in crate 'demo'"
		],
		[
			"invalid-kind",
			createFetcher(),
			{
				crateName: "demo",
				symbolname: "Client",
				symbolType: "missing"
			},
			"Error: Item 'missing.Client' not found in crate 'demo'"
		],
		[
			"error",
			createFetcher({
				load: async () => Promise.reject(new Error("missing symbol"))
			}),
			{
				crateName: "demo",
				symbolname: "runtime::Client",
				symbolType: "struct"
			},
			"Error: missing symbol"
		]
	])("%s", async (_name, fetcher, args, text) => {
		const result = await createLookupSymbolHandler(fetcher)(args)

		expect(result.isError ?? false).toBeTrue()
		expect(getText(result)).toBe(text)
	})
})
