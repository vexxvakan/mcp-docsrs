// biome-ignore-all lint/style/useNamingConvention: rustdoc JSON uses upstream snake_case keys
import type { Id } from "./core.ts"

type JsonPrimitive = boolean | null | number | string
type JsonValue = JsonArray | JsonObject | JsonPrimitive
type JsonArray = JsonValue[]
type JsonObject = {
	[key: string]: JsonValue
}

type Constant = {
	expr: string
	is_literal: boolean
	value: string | null
}
type GenericArgs =
	| {
			angle_bracketed: {
				args: GenericArg[]
				constraints: AssocItemConstraint[]
			}
	  }
	| {
			parenthesized: {
				inputs: Type[]
				output: Type | null
			}
	  }
	| "return_type_notation"
type GenericArg =
	| {
			lifetime: string
	  }
	| {
			type: Type
	  }
	| {
			const: Constant
	  }
	| "infer"
type AssocItemConstraint = {
	args: GenericArgs | null
	binding: AssocItemConstraintKind
	name: string
}
type AssocItemConstraintKind =
	| {
			equality: Term
	  }
	| {
			constraint: GenericBound[]
	  }
type DynTrait = {
	lifetime: string | null
	traits: PolyTrait[]
}
type Path = {
	args: GenericArgs | null
	id: Id
	path: string
}
type PolyTrait = {
	generic_params: GenericParamDef[]
	trait: Path
}
type FunctionPointer = {
	generic_params: GenericParamDef[]
	header: FunctionHeader
	sig: FunctionSignature
}
type QualifiedPath = {
	args: GenericArgs | null
	name: string
	self_type: Type
	trait: Path | null
}
type PatFields = {
	__pat_unstable_do_not_use: string
	type: Type
} & JsonObject
type Type =
	| {
			resolved_path: Path
	  }
	| {
			dyn_trait: DynTrait
	  }
	| {
			generic: string
	  }
	| {
			primitive: string
	  }
	| {
			function_pointer: FunctionPointer
	  }
	| {
			tuple: Type[]
	  }
	| {
			slice: Type
	  }
	| {
			array: {
				len: string
				type: Type
			}
	  }
	| {
			pat: PatFields
	  }
	| {
			impl_trait: GenericBound[]
	  }
	| "infer"
	| {
			raw_pointer: {
				is_mutable: boolean
				type: Type
			}
	  }
	| {
			borrowed_ref: {
				is_mutable: boolean
				lifetime: string | null
				type: Type
			}
	  }
	| {
			qualified_path: QualifiedPath
	  }
type Abi =
	| "rust"
	| {
			c: {
				unwind: boolean
			}
	  }
	| {
			cdecl: {
				unwind: boolean
			}
	  }
	| {
			stdcall: {
				unwind: boolean
			}
	  }
	| {
			fastcall: {
				unwind: boolean
			}
	  }
	| {
			aapcs: {
				unwind: boolean
			}
	  }
	| {
			win64: {
				unwind: boolean
			}
	  }
	| {
			sysv64: {
				unwind: boolean
			}
	  }
	| {
			system: {
				unwind: boolean
			}
	  }
	| {
			other: string
	  }
type FunctionHeader = {
	abi: Abi
	is_async: boolean
	is_const: boolean
	is_unsafe: boolean
}
type FunctionSignature = {
	inputs: [
		string,
		Type
	][]
	is_c_variadic: boolean
	output: Type | null
}
type Generics = {
	params: GenericParamDef[]
	where_predicates: WherePredicate[]
}
type GenericParamDef = {
	kind: GenericParamDefKind
	name: string
}
type GenericParamDefKind =
	| {
			lifetime: {
				outlives: string[]
			}
	  }
	| {
			type: {
				bounds: GenericBound[]
				default: Type | null
				is_synthetic: boolean
			}
	  }
	| {
			const: {
				default: string | null
				type: Type
			}
	  }
type WherePredicate =
	| {
			bound_predicate: {
				bounds: GenericBound[]
				generic_params: GenericParamDef[]
				type: Type
			}
	  }
	| {
			lifetime_predicate: {
				lifetime: string
				outlives: string[]
			}
	  }
	| {
			eq_predicate: {
				lhs: Type
				rhs: Term
			}
	  }
type GenericBound =
	| {
			trait_bound: {
				generic_params: GenericParamDef[]
				modifier: TraitBoundModifier
				trait: Path
			}
	  }
	| {
			outlives: string
	  }
	| {
			use: PreciseCapturingArg[]
	  }
type TraitBoundModifier = "none" | "maybe" | "maybe_const"
type PreciseCapturingArg =
	| {
			lifetime: string
	  }
	| {
			param: string
	  }
type Term =
	| {
			type: Type
	  }
	| {
			constant: Constant
	  }

export type {
	Abi,
	AssocItemConstraint,
	AssocItemConstraintKind,
	Constant,
	DynTrait,
	FunctionHeader,
	FunctionPointer,
	FunctionSignature,
	GenericArg,
	GenericArgs,
	GenericBound,
	GenericParamDef,
	GenericParamDefKind,
	Generics,
	JsonArray,
	JsonObject,
	JsonPrimitive,
	JsonValue,
	PatFields,
	Path,
	PolyTrait,
	PreciseCapturingArg,
	QualifiedPath,
	Term,
	TraitBoundModifier,
	Type,
	WherePredicate
}
