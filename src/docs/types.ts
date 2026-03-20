import type { RustdocJson } from "../rustdoc/types.ts"

type DocsFetchResult = {
	data: RustdocJson
	fromCache: boolean
}

type DocsFetcher = {
	clearCache: () => void
	close: () => void
	fetchCrateJson: (
		crateName: string,
		version?: string,
		target?: string,
		formatVersion?: number
	) => Promise<DocsFetchResult>
}

export type { DocsFetcher, DocsFetchResult }
