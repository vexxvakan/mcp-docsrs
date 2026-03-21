// biome-ignore-all lint/style/useNamingConvention: rustdoc item kind labels use upstream snake_case tags
import { ErrorLogger } from "../../errors.ts"
import type { Item, ItemKind } from "../rustdoc/types/items.ts"
import { getKindFromItem, KIND_LABELS } from "../shared.ts"
import {
	formatAliasDetails,
	formatCompositeDetails,
	formatEnumDetails,
	formatFunctionDetails,
	formatImplDetails,
	formatImportDetails,
	formatProcMacroDetails,
	formatStructDetails,
	formatTraitDetails,
	formatValueDetails
} from "./details.ts"

const DOC_PREVIEW_ROWS = 20
const DOC_HINT = "Use `expandDocs: true` for more info."

const toKindLabel = (kind: ItemKind | undefined, item: Item) => {
	const resolvedKind = kind ?? getKindFromItem(item)
	if (resolvedKind) {
		return KIND_LABELS[resolvedKind]
	}

	ErrorLogger.logWarning("Ignoring unsupported rustdoc item kind", {
		itemId: item.id,
		itemName: item.name
	})
	return null
}

const formatDocs = (docs: string, expandDocs: boolean) => {
	if (expandDocs) {
		return `## Documentation\n${docs}`
	}

	const lines = docs.split("\n")
	const preview = lines.slice(0, DOC_PREVIEW_ROWS).join("\n")
	return lines.length > DOC_PREVIEW_ROWS
		? `## Documentation\n${preview}\n\n${DOC_HINT}`
		: `## Documentation\n${preview}`
}

const formatItem = (item: Item, kind?: ItemKind, expandDocs = true) =>
	(() => {
		const kindLabel = toKindLabel(kind, item)

		return [
			item.name ? `# ${item.name}` : "",
			kindLabel ? `**Type:** ${kindLabel}` : "",
			item.visibility === "public"
				? ""
				: `**Visibility:** ${typeof item.visibility === "string" ? item.visibility : "restricted"}`,
			item.docs ? formatDocs(item.docs, expandDocs) : "",
			item.deprecation ? "**Deprecated:** yes" : "",
			...formatStructDetails(item),
			...formatEnumDetails(item),
			...formatFunctionDetails(item),
			...formatTraitDetails(item),
			...formatAliasDetails(item),
			...formatImplDetails(item),
			...formatImportDetails(item),
			...formatValueDetails(item),
			...formatProcMacroDetails(item),
			...formatCompositeDetails(item)
		]
			.filter(Boolean)
			.join("\n\n")
	})()

export { formatItem }
