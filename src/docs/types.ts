// biome-ignore-all lint/style/useNamingConvention: upstream rustdoc JSON uses snake_case keys
import type { JsonObject, JsonValue } from "../shared/types.ts"

type DocsRequest = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type DocsSymbolRequest = DocsRequest & {
	symbolPath: string
}

type DocsLoadResult = {
	data: RustdocJson
	fromCache: boolean
}

type DocsFetcher = {
	clearCache: () => void
	close: () => void
	lookupCrate: (input: DocsRequest) => Promise<{
		content: string
		fromCache: boolean
	}>
	lookupSymbol: (input: DocsSymbolRequest) => Promise<{
		content: string
		fromCache: boolean
	} | null>
}

type RustdocVisibility = "crate" | "default" | "public" | "restricted"

type RustdocItemKind =
	| "enum"
	| "function"
	| "impl"
	| "module"
	| "struct"
	| "trait"
	| "typedef"
	| string

type RustdocItemInner = {
	enum?: {
		generics?: JsonValue
		impls?: string[]
		variants?: string[]
		variants_stripped?: boolean
	}
	function?: {
		decl: JsonValue
		generics?: JsonValue
		header?: JsonObject
	}
	impl?: {
		for?: JsonValue
		generics?: JsonValue
		is_unsafe: boolean
		items: string[]
		provided_trait_methods?: string[]
		trait?: JsonValue
	}
	module?: {
		is_crate: boolean
		items: string[]
	}
	struct?: {
		fields?: string[]
		fields_stripped?: boolean
		generics?: JsonValue
		impls?: string[]
		struct_type: "plain" | "tuple" | "unit"
	}
	trait?: {
		bounds?: JsonValue[]
		generics?: JsonValue
		implementations?: string[]
		is_auto: boolean
		is_unsafe: boolean
		items: string[]
	}
	typedef?: {
		generics?: JsonValue
		type: JsonValue
	}
}

type RustdocItem = JsonObject & {
	attrs?: string[]
	crate_id: number
	deprecation?: JsonValue
	docs?: string
	id: string
	inner?: RustdocItemInner
	links?: Record<string, string>
	name?: string
	span?: JsonValue
	visibility: RustdocVisibility
}

type RustdocPath = {
	crate_id: number
	kind: RustdocItemKind
	path: string[]
}

type RustdocJson = JsonObject & {
	crate_version?: string
	external_crates: Record<
		string,
		{
			html_root_url?: string
			name: string
		}
	>
	format_version: number
	includes_private: boolean
	index: Record<string, RustdocItem>
	paths: Record<string, RustdocPath>
	root: string
}

type DocsSymbolQuery = {
	kind?: RustdocItemKind
	name: string
	segments: string[]
}

type CrateBuckets = {
	enums: string[]
	functions: string[]
	modules: string[]
	structs: string[]
	traits: string[]
}

export type {
	CrateBuckets,
	DocsFetcher,
	DocsLoadResult,
	DocsRequest,
	DocsSymbolQuery,
	DocsSymbolRequest,
	RustdocItem,
	RustdocItemKind,
	RustdocJson,
	RustdocPath
}
