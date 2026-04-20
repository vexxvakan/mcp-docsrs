import { ensureRoot, KIND_LABELS } from "@mcp-docsrs/docs/shared.ts"
import type { DocsFetcher } from "@mcp-docsrs/docs/types.ts"
import { ItemNotFoundError } from "@mcp-docsrs/errors"
import { createErrorResult, createStructuredResult, toErrorMessage } from "../../shared.ts"
import type { ToolHandler } from "../../types.ts"
import { findSymbol, getFirstLine, getVisibility } from "../shared.ts"
import { lookupSymbolItems } from "./details.ts"
import type { SymbolLookupInput, SymbolLookupOutput } from "./types.ts"

const lookupSymbol = (
	input: SymbolLookupInput,
	data: Awaited<ReturnType<DocsFetcher["load"]>>["data"]
) => {
	const root = ensureRoot(data)
	const match = findSymbol(data, input)
	if (!match) {
		return null
	}

	return {
		crateName: root.name ?? "unknown",
		crateVersion: data.crate_version,
		formatVersion: data.format_version,
		items: lookupSymbolItems(data, match.item),
		symbol: {
			deprecated: Boolean(match.item.deprecation),
			hasDocs: Boolean(match.item.docs),
			kind: match.kind,
			label: KIND_LABELS[match.kind],
			name: match.item.name ?? "unknown",
			path: match.path,
			summary: match.item.docs ? getFirstLine(match.item.docs) : null,
			visibility: getVisibility(match.item)
		},
		target: data.target.triple
	} satisfies SymbolLookupOutput
}

const createLookupSymbolHandler =
	(fetcher: DocsFetcher): ToolHandler<SymbolLookupInput> =>
	async (args) => {
		try {
			const { data } = await fetcher.load(args)
			const structuredContent = lookupSymbol(args, data)
			if (!structuredContent) {
				throw new ItemNotFoundError(args.crateName, `${args.symbolType}.${args.symbolname}`)
			}

			return createStructuredResult(
				structuredContent,
				`Retrieved overview for ${structuredContent.symbol.label.toLowerCase()} ${structuredContent.symbol.path ?? structuredContent.symbol.name} from ${structuredContent.crateName}${structuredContent.crateVersion ? ` v${structuredContent.crateVersion}` : ""}.`
			)
		} catch (error) {
			return createErrorResult(`Error: ${toErrorMessage(error)}`)
		}
	}

export { createLookupSymbolHandler }
