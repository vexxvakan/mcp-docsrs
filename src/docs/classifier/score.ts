import {
	hasOrderedPrefixMatch,
	hasTokenCoverage,
	normalizeText,
	tokenizeText
} from "./normalize.ts"
import type { MatchTier, RankedCrateScores, SearchCrate } from "./types.ts"

const LOG_OFFSET = 1

const toCoverage = (matches: number, total: number) => (total === 0 ? 0 : matches / total)

type TierInput = {
	nameCoverage: number
	normalizedName: string
	normalizedQuery: string
	orderedMatch: boolean
	textCoverage: number
}

const toTier = ({
	nameCoverage,
	normalizedName,
	normalizedQuery,
	orderedMatch,
	textCoverage
}: TierInput): MatchTier => {
	if (normalizedName === normalizedQuery) {
		return "exact_name"
	}
	if (normalizedName.startsWith(normalizedQuery) || orderedMatch) {
		return "name_prefix"
	}
	if (nameCoverage === 1) {
		return "name_tokens"
	}
	if (textCoverage === 1 && nameCoverage > 0) {
		return "text_tokens"
	}
	if (nameCoverage > 0 || normalizedName.includes(normalizedQuery)) {
		return "partial_name"
	}

	return "discarded"
}

const scoreCrate = (query: string, crate: SearchCrate): RankedCrateScores => {
	const normalizedQuery = normalizeText(query)
	const queryTokens = tokenizeText(query)
	const normalizedName = normalizeText(crate.name)
	const nameTokens = tokenizeText(crate.name)
	const textTokens = [
		...nameTokens,
		...tokenizeText(crate.description ?? "")
	]
	const nameMatches = hasTokenCoverage(queryTokens, nameTokens)
	const textMatches = hasTokenCoverage(queryTokens, textTokens)
	const nameCoverage = toCoverage(nameMatches, queryTokens.length)
	const textCoverage = toCoverage(textMatches, queryTokens.length)
	const orderedMatch = hasOrderedPrefixMatch(queryTokens, nameTokens)
	const tier = toTier({
		nameCoverage,
		normalizedName,
		normalizedQuery,
		orderedMatch,
		textCoverage
	})

	return {
		downloadScore: Math.log10(crate.downloads + LOG_OFFSET),
		nameCoverage,
		orderedMatch,
		recentScore: Math.log10(crate.recentDownloads + LOG_OFFSET),
		textCoverage,
		tier
	}
}

export { scoreCrate }
