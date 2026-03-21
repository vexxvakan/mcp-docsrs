// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures use upstream snake_case keys
// biome-ignore-all lint/style/noMagicNumbers: fixture ids intentionally mirror rustdoc-style numeric ids
// biome-ignore-all lint/complexity/useMaxParams: fixture helper keeps test data readable
import type { ServerConfig } from "../../config/types.ts"
import type { Visibility } from "../rustdoc/types/core.ts"
import type { Crate, Item, ItemEnum } from "../rustdoc/types/items.ts"

const TARGET = {
	target_features: [],
	triple: "x86_64-unknown-linux-gnu"
}

const EMPTY_GENERICS = {
	params: [],
	where_predicates: []
}

const createTypeParam = (name: string) => ({
	kind: {
		type: {
			bounds: [],
			default: null,
			is_synthetic: false
		}
	},
	name
})

const createPredicate = (name: string, path: string, id: number) => ({
	bound_predicate: {
		bounds: [
			{
				trait_bound: {
					generic_params: [],
					modifier: "none" as const,
					trait: {
						args: null,
						id,
						path
					}
				}
			}
		],
		generic_params: [],
		type: {
			generic: name
		}
	}
})

const createConfig = (requestTimeout = 50): ServerConfig => ({
	cacheTtl: 60_000,
	dbPath: undefined,
	maxCacheSize: 8,
	requestTimeout
})

const primitiveType = (name: string) => ({
	primitive: name
})

const resolvedPathType = (id: number, path: string) => ({
	resolved_path: {
		args: null,
		id,
		path
	}
})

const createFunction = (
	flags?: Partial<{
		is_async: boolean
		is_const: boolean
		is_unsafe: boolean
	}>
) =>
	({
		function: {
			generics: EMPTY_GENERICS,
			has_body: true,
			header: {
				abi: "rust",
				is_async: false,
				is_const: false,
				is_unsafe: false,
				...flags
			},
			sig: {
				inputs: [],
				is_c_variadic: false,
				output: null
			}
		}
	}) satisfies ItemEnum

const createItem = (
	id: number,
	name: string | null,
	visibility: Visibility,
	inner: ItemEnum,
	extra?: Partial<Pick<Item, "deprecation" | "docs">>
): Item => ({
	attrs: [],
	crate_id: 0,
	deprecation: extra?.deprecation ?? null,
	docs: extra?.docs ?? null,
	id,
	inner,
	links: {},
	name,
	span: null,
	visibility
})

const toResponse = (body: string | Uint8Array | null, encoding?: string) =>
	new Response(body, {
		headers: encoding
			? {
					"content-encoding": encoding
				}
			: undefined,
		status: 200
	})

const storeRustdocJson: Crate = {
	crate_version: "1.2.3",
	external_crates: {},
	format_version: 57,
	includes_private: false,
	index: {
		"0": createItem(
			0,
			"demo",
			"public",
			{
				module: {
					is_crate: true,
					is_stripped: false,
					items: [
						1
					]
				}
			},
			{
				docs: "Demo crate docs"
			}
		),
		"1": createItem(
			1,
			"connect",
			"public",
			createFunction({
				is_async: true
			}),
			{
				docs: "Connects to the service."
			}
		)
	},
	paths: {
		"1": {
			crate_id: 0,
			kind: "function",
			path: [
				"demo",
				"connect"
			]
		}
	},
	root: 0,
	target: TARGET
}

const queryRustdocJson: Crate = {
	crate_version: "1.2.3",
	external_crates: {},
	format_version: 57,
	includes_private: false,
	index: {
		"0": createItem(
			0,
			"demo",
			"public",
			{
				module: {
					is_crate: true,
					is_stripped: false,
					items: [
						1,
						2,
						3,
						4,
						5,
						6,
						8,
						999
					]
				}
			},
			{
				docs: "Root crate docs"
			}
		),
		"1": createItem(
			1,
			"net",
			"public",
			{
				module: {
					is_crate: false,
					is_stripped: false,
					items: []
				}
			},
			{
				docs: "Networking tools"
			}
		),
		"2": createItem(
			2,
			"Client",
			"public",
			{
				struct: {
					generics: EMPTY_GENERICS,
					impls: [
						201
					],
					kind: {
						plain: {
							fields: [
								101,
								102
							],
							has_stripped_fields: false
						}
					}
				}
			},
			{
				docs: "This summary line is intentionally longer than one hundred characters so the preview formatter has to trim it.\nExtra details stay in the full item view."
			}
		),
		"3": createItem(
			3,
			"Mode",
			"public",
			{
				enum: {
					generics: EMPTY_GENERICS,
					has_stripped_variants: false,
					impls: [
						301
					],
					variants: [
						401,
						402
					]
				}
			},
			{
				docs: "Modes for the runtime"
			}
		),
		"4": createItem(
			4,
			"Handler",
			"public",
			{
				trait: {
					bounds: [],
					generics: EMPTY_GENERICS,
					implementations: [
						501
					],
					is_auto: true,
					is_dyn_compatible: true,
					is_unsafe: true,
					items: [
						601,
						602
					]
				}
			},
			{
				docs: "Handles requests"
			}
		),
		"5": createItem(
			5,
			"connect",
			"public",
			createFunction({
				is_async: true,
				is_const: true,
				is_unsafe: true
			}),
			{
				docs: "Connect to the backend"
			}
		),
		"6": createItem(6, "hidden", "default", createFunction(), {
			docs: "Should not be listed"
		}),
		"7": createItem(
			7,
			"ClientImpl",
			"public",
			{
				impl: {
					blanket_impl: null,
					for: resolvedPathType(2, "demo::runtime::Client"),
					generics: EMPTY_GENERICS,
					is_negative: true,
					is_synthetic: true,
					is_unsafe: false,
					items: [
						17,
						18
					],
					provided_trait_methods: [
						"clone_default"
					],
					trait: {
						args: null,
						id: 901,
						path: "demo::traits::Service"
					}
				}
			},
			{
				docs: "Implementation details"
			}
		),
		"8": createItem(
			8,
			null,
			"public",
			{
				struct: {
					generics: EMPTY_GENERICS,
					impls: [],
					kind: "unit"
				}
			},
			{
				docs: "Anonymous but public"
			}
		),
		"9": createItem(
			9,
			"Alias",
			"public",
			{
				type_alias: {
					generics: EMPTY_GENERICS,
					type: resolvedPathType(900, "std::string::String")
				}
			},
			{
				docs: "Shared alias"
			}
		),
		"10": createItem(
			10,
			"Mystery",
			"crate",
			{
				proc_macro: {
					helpers: [
						"default"
					],
					kind: "derive"
				}
			},
			{
				deprecation: {
					note: "Old path",
					since: null
				},
				docs: "Mysterious item docs"
			}
		),
		"11": createItem(
			11,
			"UtilMod",
			"public",
			{
				module: {
					is_crate: false,
					is_stripped: true,
					items: [
						12,
						13
					]
				}
			},
			{
				docs: "Utility module"
			}
		),
		"12": createItem(
			12,
			"ClientAlias",
			"public",
			{
				use: {
					id: 2,
					is_glob: false,
					name: "ClientAlias",
					source: "demo::runtime::Client"
				}
			},
			{
				docs: "Re-exported client"
			}
		),
		"13": createItem(
			13,
			"Payload",
			"public",
			{
				union: {
					fields: [
						103,
						104
					],
					generics: {
						params: [
							createTypeParam("T")
						],
						where_predicates: []
					},
					has_stripped_fields: true,
					impls: [
						701
					]
				}
			},
			{
				docs: "Union payload"
			}
		),
		"14": createItem(
			14,
			"Ready",
			"public",
			{
				variant: {
					discriminant: {
						expr: "1",
						value: "1"
					},
					kind: {
						struct: {
							fields: [
								105
							],
							has_stripped_fields: false
						}
					}
				}
			},
			{
				docs: "Ready state variant"
			}
		),
		"15": createItem(
			15,
			"payload",
			"public",
			{
				struct_field: resolvedPathType(900, "std::string::String")
			},
			{
				docs: "Payload field"
			}
		),
		"16": createItem(
			16,
			"MAX_RETRIES",
			"public",
			{
				constant: {
					const: {
						expr: "42",
						is_literal: true,
						value: "42"
					},
					type: primitiveType("u32")
				}
			},
			{
				docs: "Retry count"
			}
		),
		"17": createItem(
			17,
			"BUF_SIZE",
			"public",
			{
				assoc_const: {
					type: primitiveType("usize"),
					value: "1024"
				}
			},
			{
				docs: "Buffer size"
			}
		),
		"18": createItem(
			18,
			"Output",
			"public",
			{
				assoc_type: {
					bounds: [
						{
							trait_bound: {
								generic_params: [],
								modifier: "none",
								trait: {
									args: null,
									id: 903,
									path: "core::clone::Clone"
								}
							}
						}
					],
					generics: {
						params: [
							createTypeParam("T")
						],
						where_predicates: [
							createPredicate("T", "core::marker::Send", 904)
						]
					},
					type: resolvedPathType(900, "std::string::String")
				}
			},
			{
				docs: "Associated output type"
			}
		),
		"19": createItem(
			19,
			"DEFAULT_TIMEOUT",
			"public",
			{
				static: {
					expr: "30_000",
					is_mutable: true,
					is_unsafe: false,
					type: primitiveType("u64")
				}
			},
			{
				docs: "Default timeout"
			}
		),
		"20": createItem(
			20,
			"ResultAlias",
			"public",
			{
				type_alias: {
					generics: {
						params: [
							createTypeParam("T")
						],
						where_predicates: [
							createPredicate("T", "core::fmt::Debug", 905)
						]
					},
					type: resolvedPathType(902, "core::result::Result")
				}
			},
			{
				docs: "Result alias"
			}
		),
		"21": createItem(
			21,
			"trace",
			"public",
			{
				proc_macro: {
					helpers: [
						"trace_skip"
					],
					kind: "attr"
				}
			},
			{
				docs: "Tracing attribute"
			}
		)
	},
	paths: {
		"1": {
			crate_id: 0,
			kind: "module",
			path: [
				"demo",
				"net"
			]
		},
		"2": {
			crate_id: 0,
			kind: "struct",
			path: [
				"demo",
				"runtime",
				"Client"
			]
		},
		"3": {
			crate_id: 0,
			kind: "enum",
			path: [
				"demo",
				"Mode"
			]
		},
		"4": {
			crate_id: 0,
			kind: "trait",
			path: [
				"demo",
				"Handler"
			]
		},
		"5": {
			crate_id: 0,
			kind: "function",
			path: [
				"demo",
				"connect"
			]
		},
		"9": {
			crate_id: 0,
			kind: "type_alias",
			path: [
				"demo",
				"Alias"
			]
		},
		"20": {
			crate_id: 0,
			kind: "type_alias",
			path: [
				"demo",
				"ResultAlias"
			]
		},
		"9999": {
			crate_id: 0,
			kind: "macro",
			path: [
				"demo",
				"Ghost"
			]
		}
	},
	root: 0,
	target: TARGET
}

const createQueryJson = () => structuredClone(queryRustdocJson)

const createStoreJson = () => structuredClone(storeRustdocJson)

export {
	createConfig,
	createQueryJson,
	createStoreJson,
	queryRustdocJson,
	storeRustdocJson,
	toResponse
}
