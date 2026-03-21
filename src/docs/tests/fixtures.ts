// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures use upstream snake_case keys
import type { ServerConfig } from "../../config/types.ts"
import type { RustdocJson } from "../types.ts"

const createConfig = (requestTimeout = 50): ServerConfig => ({
	cacheTtl: 60_000,
	dbPath: undefined,
	maxCacheSize: 8,
	requestTimeout
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

const storeRustdocJson: RustdocJson = {
	crate_version: "1.2.3",
	external_crates: {},
	format_version: 43,
	includes_private: false,
	index: {
		connect: {
			crate_id: 0,
			docs: "Connects to the service.",
			id: "connect",
			inner: {
				function: {
					decl: {},
					header: {
						async: true
					}
				}
			},
			name: "connect",
			visibility: "public"
		},
		root: {
			crate_id: 0,
			docs: "Demo crate docs",
			id: "root",
			inner: {
				module: {
					is_crate: true,
					items: [
						"connect"
					]
				}
			},
			name: "demo",
			visibility: "public"
		}
	},
	paths: {
		connect: {
			crate_id: 0,
			kind: "function",
			path: [
				"demo",
				"connect"
			]
		}
	},
	root: "root"
}

const queryRustdocJson: RustdocJson = {
	crate_version: "1.2.3",
	external_crates: {},
	format_version: 43,
	includes_private: false,
	index: {
		anon_struct: {
			crate_id: 0,
			docs: "Anonymous but public",
			id: "anon_struct",
			inner: {
				struct: {
					fields: [],
					impls: [],
					struct_type: "unit"
				}
			},
			visibility: "public"
		},
		empty_inner_item: {
			crate_id: 0,
			docs: "No structured kind information",
			id: "empty_inner_item",
			inner: {},
			name: "EmptyInner",
			visibility: "public"
		},
		enum_item: {
			crate_id: 0,
			docs: "Modes for the runtime",
			id: "enum_item",
			inner: {
				enum: {
					impls: [
						"enum_impl"
					],
					variants: [
						"fast",
						"slow"
					]
				}
			},
			name: "Mode",
			visibility: "public"
		},
		function_item: {
			crate_id: 0,
			docs: "Connect to the backend",
			id: "function_item",
			inner: {
				function: {
					decl: {},
					header: {
						async: true,
						const: true,
						unsafe: true
					}
				}
			},
			name: "connect",
			visibility: "public"
		},
		hidden_item: {
			crate_id: 0,
			docs: "Should not be listed",
			id: "hidden_item",
			inner: {
				function: {
					decl: {}
				}
			},
			name: "hidden",
			visibility: "default"
		},
		impl_item: {
			crate_id: 0,
			docs: "Implementation details",
			id: "impl_item",
			inner: {
				impl: {
					for: {},
					is_unsafe: false,
					items: []
				}
			},
			name: "ClientImpl",
			visibility: "public"
		},
		module_item: {
			crate_id: 0,
			docs: "Networking tools",
			id: "module_item",
			inner: {
				module: {
					is_crate: false,
					items: []
				}
			},
			name: "net",
			visibility: "public"
		},
		root: {
			crate_id: 0,
			docs: "Root crate docs",
			id: "root",
			inner: {
				module: {
					is_crate: true,
					items: [
						"module_item",
						"struct_item",
						"anon_struct",
						"enum_item",
						"trait_item",
						"function_item",
						"hidden_item",
						"missing_item"
					]
				}
			},
			name: "demo",
			visibility: "public"
		},
		struct_item: {
			crate_id: 0,
			docs: "This summary line is intentionally longer than one hundred characters so the preview formatter has to trim it.\nExtra details stay in the full item view.",
			id: "struct_item",
			inner: {
				struct: {
					fields: [
						"field_one",
						"field_two"
					],
					impls: [
						"impl_one"
					],
					struct_type: "plain"
				}
			},
			name: "Client",
			visibility: "public"
		},
		trait_item: {
			crate_id: 0,
			docs: "Handles requests",
			id: "trait_item",
			inner: {
				trait: {
					is_auto: true,
					is_unsafe: true,
					items: [
						"method_one",
						"method_two"
					]
				}
			},
			name: "Handler",
			visibility: "public"
		},
		typedef_item: {
			crate_id: 0,
			docs: "Shared alias",
			id: "typedef_item",
			inner: {
				typedef: {
					type: "String"
				}
			},
			name: "Alias",
			visibility: "public"
		},
		unknown_item: {
			crate_id: 0,
			deprecation: {
				note: "Old path"
			},
			docs: "Mysterious item docs",
			id: "unknown_item",
			name: "Mystery",
			visibility: "crate"
		}
	},
	paths: {
		enum_item: {
			crate_id: 0,
			kind: "enum",
			path: [
				"demo",
				"Mode"
			]
		},
		function_item: {
			crate_id: 0,
			kind: "function",
			path: [
				"demo",
				"connect"
			]
		},
		module_item: {
			crate_id: 0,
			kind: "module",
			path: [
				"demo",
				"net"
			]
		},
		struct_item: {
			crate_id: 0,
			kind: "struct",
			path: [
				"demo",
				"runtime",
				"Client"
			]
		},
		trait_item: {
			crate_id: 0,
			kind: "trait",
			path: [
				"demo",
				"Handler"
			]
		},
		unknown_path_item: {
			crate_id: 0,
			kind: "macro",
			path: [
				"demo",
				"Mystery"
			]
		}
	},
	root: "root"
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
