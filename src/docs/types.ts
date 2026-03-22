import type { Crate } from "./rustdoc/types/items.ts"

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
	load: (input: DocsRequest) => Promise<DocsLoadResult>
}

export type { DocsFetcher, DocsLoadResult, DocsRequest, DocsSymbolRequest }
