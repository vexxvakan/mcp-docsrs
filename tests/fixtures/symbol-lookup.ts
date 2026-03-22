// biome-ignore-all lint/complexity/useMaxParams: test fixture helpers keep rustdoc data readable
// biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: grouped rustdoc fixture builders are clearer in tests
// biome-ignore-all lint/style/noMagicNumbers: rustdoc fixture ids intentionally mirror JSON ids
// biome-ignore-all lint/style/useNamingConvention: rustdoc fixture objects use upstream snake_case keys
import type { Visibility } from "../../src/docs/rustdoc/types/core.ts"
import type { Crate, Item, ItemEnum } from "../../src/docs/rustdoc/types/items.ts"
import { createQueryJson } from "./docs.ts"

const EMPTY_GENERICS = {
	params: [],
	where_predicates: []
}

const resolvedPath = (id: number, path: string) => ({
	resolved_path: {
		args: null,
		id,
		path
	}
})

const createItem = (
	id: number,
	name: string | null,
	visibility: Visibility,
	inner: ItemEnum,
	docs: string | null
): Item => ({
	attrs: [],
	crate_id: 0,
	deprecation: null,
	docs,
	id,
	inner,
	links: {},
	name,
	span: null,
	visibility
})

const createTraitItem = (id: number, name: string, isAuto: boolean, docs: string) =>
	createItem(
		id,
		name,
		"public",
		{
			trait: {
				bounds: [],
				generics: EMPTY_GENERICS,
				implementations: [],
				is_auto: isAuto,
				is_dyn_compatible: true,
				is_unsafe: false,
				items: []
			}
		},
		docs
	)

const createImplItem = (
	id: number,
	name: string,
	forId: number,
	forPath: string,
	traitId: number,
	traitPath: string,
	docs: string,
	blanketImpl:
		| ReturnType<typeof resolvedPath>
		| {
				primitive: string
		  }
		| null = null
) =>
	createItem(
		id,
		name,
		"public",
		{
			impl: {
				blanket_impl: blanketImpl,
				for: resolvedPath(forId, forPath),
				generics: EMPTY_GENERICS,
				is_negative: false,
				is_synthetic: false,
				is_unsafe: false,
				items: [],
				provided_trait_methods: [],
				trait: {
					args: null,
					id: traitId,
					path: traitPath
				}
			}
		},
		docs
	)

const createStructLookupJson = () => {
	const data = createQueryJson()
	data.index["101"] = createItem(
		101,
		"config",
		"public",
		{
			struct_field: {
				primitive: "u32"
			}
		},
		"Configuration field"
	)
	data.index["102"] = createItem(
		102,
		"state",
		"public",
		{
			struct_field: {
				primitive: "u32"
			}
		},
		"State field"
	)
	data.index["901"] = createTraitItem(901, "Service", false, "Service trait")
	data.index["902"] = createTraitItem(902, "AutoService", true, "Auto service trait")
	data.index["22"] = createImplItem(
		22,
		"AutoClientImpl",
		2,
		"demo::runtime::Client",
		902,
		"demo::traits::AutoService",
		"Auto implementation"
	)
	data.index["23"] = createImplItem(
		23,
		"BlanketClientImpl",
		2,
		"demo::runtime::Client",
		903,
		"demo::traits::Blanket",
		"Blanket implementation",
		{
			primitive: "u32"
		}
	)
	data.index["2"] = {
		...data.index["2"],
		inner: {
			struct: {
				generics: EMPTY_GENERICS,
				impls: [
					7,
					22,
					23
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
		}
	}
	data.index["7"] = createImplItem(
		7,
		"ClientImpl",
		2,
		"demo::runtime::Client",
		901,
		"demo::traits::Service",
		"Implementation details"
	)

	return data satisfies Crate
}

const createEnumLookupJson = () => {
	const data = createQueryJson()
	data.index["401"] = createItem(
		401,
		"Ready",
		"public",
		{
			variant: {
				discriminant: null,
				kind: "plain"
			}
		},
		"Ready variant"
	)
	data.index["402"] = createItem(
		402,
		"Busy",
		"public",
		{
			variant: {
				discriminant: null,
				kind: "plain"
			}
		},
		"Busy variant"
	)
	data.index["904"] = createTraitItem(904, "ModeAuto", true, "Mode auto trait")
	data.index["24"] = createImplItem(
		24,
		"ModeAutoImpl",
		3,
		"demo::Mode",
		904,
		"demo::traits::ModeAuto",
		"Mode auto implementation"
	)
	data.index["25"] = createImplItem(
		25,
		"ModeImpl",
		3,
		"demo::Mode",
		905,
		"demo::traits::ModeTrait",
		"Mode trait implementation"
	)
	data.index["26"] = createImplItem(
		26,
		"ModeBlanketImpl",
		3,
		"demo::Mode",
		906,
		"demo::traits::ModeBlanket",
		"Mode blanket implementation",
		{
			primitive: "bool"
		}
	)
	data.index["3"] = {
		...data.index["3"],
		inner: {
			enum: {
				generics: EMPTY_GENERICS,
				has_stripped_variants: false,
				impls: [
					24,
					25,
					26
				],
				variants: [
					401,
					402
				]
			}
		}
	}

	return data satisfies Crate
}

const createModuleLookupJson = () => {
	const data = createQueryJson()
	if (typeof data.index["0"].inner === "object" && "module" in data.index["0"].inner) {
		data.index["0"].inner.module.items = [
			1,
			2,
			3,
			5,
			12
		]
	}

	return data satisfies Crate
}

export { createEnumLookupJson, createModuleLookupJson, createStructLookupJson }
