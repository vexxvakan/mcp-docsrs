import type { CrateLookupOutput } from "../tools/crate/lookup/types.ts"
import type { SymbolLookupOutput } from "../tools/symbol/lookup/types.ts"
import type { Crate, ItemKind } from "./rustdoc/types/items.ts"

type DocsRequest = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type DocsSymbolRequest = DocsRequest & {
	symbolType: string
	symbolname: string
}

type DocsLoadResult = {
	data: Crate
	fromCache: boolean
}

type DocsFetcher = {
	clearCache: () => void
	close: () => void
	lookupCrate: (input: DocsRequest) => Promise<{
		content: string
		fromCache: boolean
		structuredContent: CrateLookupOutput
	}>
	lookupCrateDocs: (input: DocsRequest) => Promise<{
		content: string
		fromCache: boolean
	}>
	lookupSymbol: (input: DocsSymbolRequest) => Promise<{
		content: string
		fromCache: boolean
		structuredContent: SymbolLookupOutput
	} | null>
	lookupSymbolDocs: (input: DocsSymbolRequest) => Promise<{
		content: string
		fromCache: boolean
	} | null>
}

type DocsSymbolQuery = {
	kind: ItemKind | null
	name: string
	segments: string[]
}

export type { DocsFetcher, DocsLoadResult, DocsRequest, DocsSymbolQuery, DocsSymbolRequest }
