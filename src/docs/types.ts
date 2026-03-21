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

type RustdocId = number

type RustdocVisibility =
	| "public"
	| "default"
	| "crate"
	| {
			restricted: {
				parent: RustdocId
				path: string
			}
	  }

type RustdocItemKind =
	| "assoc_const"
	| "assoc_type"
	| "attribute"
	| "constant"
	| "enum"
	| "extern_crate"
	| "extern_type"
	| "function"
	| "impl"
	| "keyword"
	| "macro"
	| "module"
	| "primitive"
	| "proc_attribute"
	| "proc_derive"
	| "static"
	| "struct"
	| "struct_field"
	| "trait"
	| "trait_alias"
	| "type_alias"
	| "union"
	| "use"
	| "variant"

type RustdocTarget = {
	target_features: {
		globally_enabled: boolean
		implies_features: string[]
		name: string
		unstable_feature_gate: string | null
	}[]
	triple: string
}

type RustdocExternalCrate = {
	html_root_url: string | null
	name: string
	path: string
}

type RustdocGenerics = JsonValue
type RustdocGenericBound = JsonValue
type RustdocType = JsonValue
type RustdocSignature = JsonValue
type RustdocConstantExpr = JsonValue

type RustdocStructKind =
	| "unit"
	| {
			tuple: Array<RustdocId | null>
	  }
	| {
			plain: {
				fields: RustdocId[]
				has_stripped_fields: boolean
			}
	  }

type RustdocVariantKind =
	| "plain"
	| {
			tuple: Array<RustdocId | null>
	  }
	| {
			struct: {
				fields: RustdocId[]
				has_stripped_fields: boolean
			}
	  }

type RustdocModule = {
	is_crate: boolean
	is_stripped: boolean
	items: RustdocId[]
}
type RustdocUnion = {
	fields: RustdocId[]
	generics: RustdocGenerics
	has_stripped_fields: boolean
	impls: RustdocId[]
}
type RustdocStruct = {
	generics: RustdocGenerics
	impls: RustdocId[]
	kind: RustdocStructKind
}
type RustdocEnum = {
	generics: RustdocGenerics
	has_stripped_variants: boolean
	impls: RustdocId[]
	variants: RustdocId[]
}
type RustdocVariant = {
	discriminant: {
		expr: string
		value: string
	} | null
	kind: RustdocVariantKind
}
type RustdocFunctionHeader = {
	abi: JsonValue
	is_async: boolean
	is_const: boolean
	is_unsafe: boolean
}
type RustdocFunction = {
	generics: RustdocGenerics
	has_body: boolean
	header: RustdocFunctionHeader
	sig: RustdocSignature
}
type RustdocTrait = {
	bounds: RustdocGenericBound[]
	generics: RustdocGenerics
	implementations: RustdocId[]
	is_auto: boolean
	is_dyn_compatible: boolean
	is_unsafe: boolean
	items: RustdocId[]
}
type RustdocTraitAlias = {
	generics: RustdocGenerics
	params: RustdocGenericBound[]
}
type RustdocImpl = {
	blanket_impl: RustdocType | null
	for: RustdocType
	generics: RustdocGenerics
	is_negative: boolean
	is_synthetic: boolean
	is_unsafe: boolean
	items: RustdocId[]
	provided_trait_methods: string[]
	trait: JsonValue | null
}
type RustdocUse = {
	id: RustdocId | null
	is_glob: boolean
	name: string
	source: string
}
type RustdocProcMacro = {
	helpers: string[]
	kind: "attr" | "bang" | "derive"
}
type RustdocTypeAlias = {
	generics: RustdocGenerics
	type: RustdocType
}
type RustdocStatic = {
	expr: string
	is_mutable: boolean
	is_unsafe: boolean
	type: RustdocType
}
type RustdocPrimitive = {
	impls: RustdocId[]
	name: string
}

type RustdocItemInner =
	| "extern_type"
	| {
			assoc_const: {
				type: RustdocType
				value: string | null
			}
	  }
	| {
			assoc_type: {
				bounds: RustdocGenericBound[]
				generics: RustdocGenerics
				type: RustdocType | null
			}
	  }
	| {
			constant: {
				const: RustdocConstantExpr
				type: RustdocType
			}
	  }
	| {
			enum: RustdocEnum
	  }
	| {
			extern_crate: {
				name: string
				rename: string | null
			}
	  }
	| {
			function: RustdocFunction
	  }
	| {
			impl: RustdocImpl
	  }
	| {
			macro: string
	  }
	| {
			module: RustdocModule
	  }
	| {
			primitive: RustdocPrimitive
	  }
	| {
			proc_macro: RustdocProcMacro
	  }
	| {
			static: RustdocStatic
	  }
	| {
			struct: RustdocStruct
	  }
	| {
			struct_field: RustdocType
	  }
	| {
			trait: RustdocTrait
	  }
	| {
			trait_alias: RustdocTraitAlias
	  }
	| {
			type_alias: RustdocTypeAlias
	  }
	| {
			union: RustdocUnion
	  }
	| {
			use: RustdocUse
	  }
	| {
			variant: RustdocVariant
	  }

type RustdocItem = JsonObject & {
	attrs: JsonValue[]
	crate_id: number
	deprecation: JsonValue | null
	docs: string | null
	id: RustdocId
	inner: RustdocItemInner
	links: Record<string, RustdocId>
	name: string | null
	span: JsonValue | null
	visibility: RustdocVisibility
}

type RustdocPath = {
	crate_id: number
	kind: RustdocItemKind
	path: string[]
}

type RustdocJson = JsonObject & {
	crate_version: string | null
	external_crates: Record<string, RustdocExternalCrate>
	format_version: number
	includes_private: boolean
	index: Record<string, RustdocItem>
	paths: Record<string, RustdocPath>
	root: RustdocId
	target: RustdocTarget
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
	RustdocId,
	RustdocItem,
	RustdocItemInner,
	RustdocItemKind,
	RustdocJson,
	RustdocPath,
	RustdocStruct,
	RustdocStructKind,
	RustdocVariantKind,
	RustdocVisibility
}
