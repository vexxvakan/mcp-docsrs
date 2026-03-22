import type { Crate, Item, ItemKind } from "@mcp-docsrs/docs/rustdoc/types/items.ts"

type DocsSymbolQuery = {
	kind: ItemKind | null
	name: string
	segments: string[]
}

type CandidateScoreInput = {
	indexPaths: Record<string, string[]>
	item: Item
	json: Crate
	key: string
	kind?: ItemKind
	query: DocsSymbolQuery
}

type SymbolMatch = {
	item: Item
	key: string
	kind: ItemKind
	path: string | null
}

export type { CandidateScoreInput, DocsSymbolQuery, SymbolMatch }
