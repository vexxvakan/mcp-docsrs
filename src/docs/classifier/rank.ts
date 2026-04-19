import { scoreCrate } from "./score.ts"
import type { RankedCrate, RankedCrateScores, SearchCrate } from "./types.ts"

const EXACT_NAME_TIER = 5
const NAME_PREFIX_TIER = 4
const NAME_TOKENS_TIER = 3
const TEXT_TOKENS_TIER = 2
const PARTIAL_NAME_TIER = 1
const DISCARDED_TIER = 0

const compareBooleans = (left: boolean, right: boolean) => Number(right) - Number(left)

const compareNumbers = (left: number, right: number) => right - left

const getTierOrder = (tier: RankedCrateScores["tier"]) => {
	switch (tier) {
		case "exact_name":
			return EXACT_NAME_TIER
		case "name_prefix":
			return NAME_PREFIX_TIER
		case "name_tokens":
			return NAME_TOKENS_TIER
		case "text_tokens":
			return TEXT_TOKENS_TIER
		case "partial_name":
			return PARTIAL_NAME_TIER
		case "discarded":
			return DISCARDED_TIER
		default:
			return DISCARDED_TIER
	}
}

const compareRankedCrates = (left: RankedCrate, right: RankedCrate) =>
	compareNumbers(getTierOrder(left.scores.tier), getTierOrder(right.scores.tier)) ||
	compareNumbers(left.scores.nameCoverage, right.scores.nameCoverage) ||
	compareBooleans(left.scores.orderedMatch, right.scores.orderedMatch) ||
	compareNumbers(left.scores.downloadScore, right.scores.downloadScore) ||
	compareNumbers(left.scores.recentScore, right.scores.recentScore) ||
	left.crate.name.localeCompare(right.crate.name)

const rankCrates = (query: string, crates: SearchCrate[]) =>
	crates
		.map((crate) => ({
			crate,
			scores: scoreCrate(query, crate)
		}))
		.filter((candidate) => candidate.scores.tier !== "discarded")
		.sort(compareRankedCrates)

export { getTierOrder, rankCrates }
