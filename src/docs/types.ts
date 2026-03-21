import type { Crate, ItemKind } from "./rustdoc/types/items.ts"

type DocsRequest = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type DocsSymbolRequest = DocsRequest & {
	expandDocs: boolean
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
	}>
	lookupCrateDocs: (input: DocsRequest) => Promise<{
		content: string
		fromCache: boolean
	}>
	lookupSymbol: (input: DocsSymbolRequest) => Promise<{
		content: string
		fromCache: boolean
	} | null>
}

type DocsSymbolQuery = {
	expandDocs: boolean
	kind: ItemKind | null
	name: string
	segments: string[]
}

type CrateBuckets = Record<ItemKind, string[]>

export type {
	CrateBuckets,
	DocsFetcher,
	DocsLoadResult,
	DocsRequest,
	DocsSymbolQuery,
	DocsSymbolRequest
}
