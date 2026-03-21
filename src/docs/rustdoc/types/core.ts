// biome-ignore-all lint/style/useNamingConvention: rustdoc JSON uses upstream snake_case keys
type Id = number
type ReprKind = "c" | "rust" | "simd" | "transparent"
type AttributeRepr = {
	align: number | null
	int: string | null
	kind: ReprKind
	packed: number | null
}
type Attribute =
	| "non_exhaustive"
	| {
			must_use: {
				reason: string | null
			}
	  }
	| "macro_export"
	| {
			export_name: string
	  }
	| {
			link_section: string
	  }
	| "automatically_derived"
	| {
			repr: AttributeRepr
	  }
	| "no_mangle"
	| {
			target_feature: {
				enable: string[]
			}
	  }
	| {
			other: string
	  }
type Visibility =
	| "public"
	| "default"
	| "crate"
	| {
			restricted: {
				parent: Id
				path: string
			}
	  }
type TargetFeature = {
	globally_enabled: boolean
	implies_features: string[]
	name: string
	unstable_feature_gate: string | null
}
type Target = {
	target_features: TargetFeature[]
	triple: string
}
type ExternalCrate = {
	html_root_url: string | null
	name: string
}
type Span = {
	begin: [
		number,
		number
	]
	end: [
		number,
		number
	]
	filename: string
}
type Deprecation = {
	note: string | null
	since: string | null
}

export type {
	Attribute,
	AttributeRepr,
	Deprecation,
	ExternalCrate,
	Id,
	ReprKind,
	Span,
	Target,
	TargetFeature,
	Visibility
}
