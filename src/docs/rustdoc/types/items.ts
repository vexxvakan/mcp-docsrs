// biome-ignore-all lint/style/useNamingConvention: rustdoc JSON uses upstream snake_case keys
import type { Attribute, Deprecation, ExternalCrate, Id, Span, Target, Visibility } from "./core.ts"
import type {
	Constant,
	FunctionHeader,
	FunctionSignature,
	GenericBound,
	Generics,
	Path,
	Type
} from "./system.ts"

type ItemKind =
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
type ItemSummary = {
	crate_id: number
	kind: ItemKind
	path: string[]
}
type Module = {
	is_crate: boolean
	is_stripped: boolean
	items: Id[]
}
type Union = {
	fields: Id[]
	generics: Generics
	has_stripped_fields: boolean
	impls: Id[]
}
type StructKind =
	| "unit"
	| {
			tuple: Array<Id | null>
	  }
	| {
			plain: {
				fields: Id[]
				has_stripped_fields: boolean
			}
	  }
type Struct = {
	generics: Generics
	impls: Id[]
	kind: StructKind
}
type Enum = {
	generics: Generics
	has_stripped_variants: boolean
	impls: Id[]
	variants: Id[]
}
type VariantKind =
	| "plain"
	| {
			tuple: Array<Id | null>
	  }
	| {
			struct: {
				fields: Id[]
				has_stripped_fields: boolean
			}
	  }
type Discriminant = {
	expr: string
	value: string
}
type Variant = {
	discriminant: Discriminant | null
	kind: VariantKind
}
type Function = {
	generics: Generics
	has_body: boolean
	header: FunctionHeader
	sig: FunctionSignature
}
type Trait = {
	bounds: GenericBound[]
	generics: Generics
	implementations: Id[]
	is_auto: boolean
	is_dyn_compatible: boolean
	is_unsafe: boolean
	items: Id[]
}
type TraitAlias = {
	generics: Generics
	params: GenericBound[]
}
type Impl = {
	blanket_impl: Type | null
	for: Type
	generics: Generics
	is_negative: boolean
	is_synthetic: boolean
	is_unsafe: boolean
	items: Id[]
	provided_trait_methods: string[]
	trait: Path | null
}
type Use = {
	id: Id | null
	is_glob: boolean
	name: string
	source: string
}
type MacroKind = "attr" | "bang" | "derive"
type ProcMacro = {
	helpers: string[]
	kind: MacroKind
}
type TypeAlias = {
	generics: Generics
	type: Type
}
type Static = {
	expr: string
	is_mutable: boolean
	is_unsafe: boolean
	type: Type
}
type Primitive = {
	impls: Id[]
	name: string
}
type ItemEnum =
	| "extern_type"
	| {
			module: Module
	  }
	| {
			extern_crate: {
				name: string
				rename: string | null
			}
	  }
	| {
			use: Use
	  }
	| {
			struct: Struct
	  }
	| {
			struct_field: Type
	  }
	| {
			union: Union
	  }
	| {
			enum: Enum
	  }
	| {
			variant: Variant
	  }
	| {
			function: Function
	  }
	| {
			type_alias: TypeAlias
	  }
	| {
			constant: {
				const: Constant
				type: Type
			}
	  }
	| {
			trait: Trait
	  }
	| {
			trait_alias: TraitAlias
	  }
	| {
			impl: Impl
	  }
	| {
			static: Static
	  }
	| {
			macro: string
	  }
	| {
			proc_macro: ProcMacro
	  }
	| {
			assoc_const: {
				type: Type
				value: string | null
			}
	  }
	| {
			assoc_type: {
				bounds: GenericBound[]
				generics: Generics
				type: Type | null
			}
	  }
	| {
			primitive: Primitive
	  }
type Item = {
	attrs: Attribute[]
	crate_id: number
	deprecation: Deprecation | null
	docs: string | null
	id: Id
	inner: ItemEnum
	links: Record<string, Id>
	name: string | null
	span: Span | null
	visibility: Visibility
}
type Crate = {
	crate_version: string | null
	external_crates: Record<string, ExternalCrate>
	format_version: number
	includes_private: boolean
	index: Record<string, Item>
	paths: Record<string, ItemSummary>
	root: Id
	target: Target
}

export type {
	Crate,
	Discriminant,
	Enum,
	Function,
	Impl,
	Item,
	ItemEnum,
	ItemKind,
	ItemSummary,
	MacroKind,
	Module,
	Primitive,
	ProcMacro,
	Static,
	Struct,
	StructKind,
	Trait,
	TraitAlias,
	TypeAlias,
	Union,
	Use,
	Variant,
	VariantKind
}
