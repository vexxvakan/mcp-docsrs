type SearchCrate = {
	createdAt: string | null
	description: string | null
	documentation: string | null
	downloads: number
	homepage: string | null
	maxVersion: string
	name: string
	recentDownloads: number
	repository: string | null
	updatedAt: string | null
}

type MatchTier =
	| "exact_name"
	| "name_prefix"
	| "name_tokens"
	| "text_tokens"
	| "partial_name"
	| "discarded"

type RankedCrateScores = {
	downloadScore: number
	nameCoverage: number
	orderedMatch: boolean
	recentScore: number
	textCoverage: number
	tier: MatchTier
}

type RankedCrate = {
	crate: SearchCrate
	scores: RankedCrateScores
}

export type { MatchTier, RankedCrate, RankedCrateScores, SearchCrate }
