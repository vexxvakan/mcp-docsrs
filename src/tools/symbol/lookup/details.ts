import type { Crate, Item, StructKind } from "@mcp-docsrs/docs/rustdoc/types/items.ts"
import { getItemById, getKindFromItem, KIND_LABELS, toIdKey } from "@mcp-docsrs/docs/shared.ts"
import { getFirstLine } from "../shared.ts"
import type { SymbolLookupItems } from "./types.ts"

const getItemName = (json: Crate, item: Item) =>
	item.name ?? json.paths[toIdKey(item.id)]?.path.at(-1) ?? String(item.id)

const getItemDescription = (kind: string, item: Item) =>
	item.docs ? getFirstLine(item.docs) : (KIND_LABELS[kind as keyof typeof KIND_LABELS] ?? "")

const setRecordValue = (record: Record<string, string>, key: string, value: string) => {
	if (!(key in record)) {
		record[key] = value
	}
}

const collectItems = (json: Crate, ids: Array<number | null>) => {
	const items: Record<string, string> = {}
	for (const id of ids) {
		if (id === null) {
			continue
		}

		const item = getItemById(json, id)
		const kind = item ? getKindFromItem(item) : undefined
		if (!(item && kind)) {
			continue
		}

		setRecordValue(items, getItemName(json, item), getItemDescription(kind, item))
	}

	return items
}

const getImplBucket = (input: {
	blanketImpl: unknown
	buckets: Pick<Required<SymbolLookupItems>, "autoTraits" | "blankets" | "traits">
	item: Item
	json: Crate
	traitId: number
	traitPath: string
}) => {
	if (input.blanketImpl) {
		return {
			bucket: input.buckets.blankets,
			key: input.traitPath,
			value: input.item.docs ? getFirstLine(input.item.docs) : "Implementation"
		}
	}

	const traitItem = getItemById(input.json, input.traitId)
	if (traitItem && typeof traitItem.inner === "object" && "trait" in traitItem.inner) {
		return {
			bucket: traitItem.inner.trait.is_auto ? input.buckets.autoTraits : input.buckets.traits,
			key: input.traitPath,
			value: input.item.docs ? getFirstLine(input.item.docs) : "Implementation"
		}
	}

	return {
		bucket: input.buckets.traits,
		key: input.traitPath,
		value: input.item.docs ? getFirstLine(input.item.docs) : "Implementation"
	}
}

const collectStructFields = (json: Crate, kind: StructKind) => {
	if (kind === "unit") {
		return {}
	}

	if ("plain" in kind) {
		return collectItems(json, kind.plain.fields)
	}

	return collectItems(json, kind.tuple)
}

const collectImplBuckets = (json: Crate, ids: number[]) => {
	const traits: Record<string, string> = {}
	const autoTraits: Record<string, string> = {}
	const blankets: Record<string, string> = {}

	for (const id of ids) {
		const item = getItemById(json, id)
		if (!item || typeof item.inner !== "object" || !("impl" in item.inner)) {
			continue
		}

		const impl = item.inner.impl
		if (!impl.trait) {
			continue
		}

		const selected = getImplBucket({
			blanketImpl: impl.blanket_impl,
			buckets: {
				autoTraits,
				blankets,
				traits
			},
			item,
			json,
			traitId: impl.trait.id,
			traitPath: impl.trait.path
		})
		setRecordValue(selected.bucket, selected.key, selected.value)
	}

	return {
		autoTraits,
		blankets,
		traits
	}
}

const collectModuleItems = (json: Crate, item: Item) => {
	if (typeof item.inner !== "object" || !("module" in item.inner)) {
		return
	}

	const reexports: Record<string, string> = {}
	const modules: Record<string, string> = {}
	const structs: Record<string, string> = {}
	const enums: Record<string, string> = {}
	const functions: Record<string, string> = {}

	for (const childId of item.inner.module.items) {
		const child = getItemById(json, childId)
		const kind = child ? getKindFromItem(child) : undefined
		if (!(child && kind)) {
			continue
		}

		const key = getItemName(json, child)
		const value = getItemDescription(kind, child)

		switch (kind) {
			case "use":
				setRecordValue(reexports, key, value)
				break
			case "module":
				setRecordValue(modules, key, value)
				break
			case "struct":
				setRecordValue(structs, key, value)
				break
			case "enum":
				setRecordValue(enums, key, value)
				break
			case "function":
				setRecordValue(functions, key, value)
				break
			default:
				break
		}
	}

	return {
		enums,
		functions,
		modules,
		reexports,
		structs
	} satisfies SymbolLookupItems
}

const collectStructItems = (json: Crate, item: Item) => {
	if (typeof item.inner !== "object" || !("struct" in item.inner)) {
		return
	}

	return {
		fields: collectStructFields(json, item.inner.struct.kind),
		...collectImplBuckets(json, item.inner.struct.impls)
	} satisfies SymbolLookupItems
}

const collectEnumItems = (json: Crate, item: Item) => {
	if (typeof item.inner !== "object" || !("enum" in item.inner)) {
		return
	}

	return {
		variants: collectItems(json, item.inner.enum.variants),
		...collectImplBuckets(json, item.inner.enum.impls)
	} satisfies SymbolLookupItems
}

const lookupSymbolItems = (json: Crate, item: Item) => {
	const kind = getKindFromItem(item)
	switch (kind) {
		case "module":
			return collectModuleItems(json, item)
		case "struct":
			return collectStructItems(json, item)
		case "enum":
			return collectEnumItems(json, item)
		default:
			return
	}
}

export { lookupSymbolItems }
