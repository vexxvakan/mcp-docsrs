const SEPARATOR_PATTERN = /[-_./:]+/g
const WHITESPACE_PATTERN = /\s+/g

const normalizeText = (value: string) =>
	value.toLowerCase().replace(SEPARATOR_PATTERN, " ").replace(WHITESPACE_PATTERN, " ").trim()

const tokenizeText = (value: string) => {
	const normalized = normalizeText(value)
	if (normalized.length === 0) {
		return []
	}

	const tokens = normalized.split(" ")
	const filtered = tokens.filter((token) => token.length > 1)

	return filtered.length > 0 || normalized.length > 1 ? filtered : tokens
}

const hasTokenCoverage = (queryTokens: string[], candidateTokens: string[]) =>
	queryTokens.filter((queryToken) =>
		candidateTokens.some((candidateToken) => candidateToken.startsWith(queryToken))
	).length

const hasOrderedPrefixMatch = (queryTokens: string[], nameTokens: string[]) => {
	if (queryTokens.length === 0 || queryTokens.length > nameTokens.length) {
		return false
	}

	return queryTokens.every((queryToken, index) => nameTokens[index]?.startsWith(queryToken))
}

export { hasOrderedPrefixMatch, hasTokenCoverage, normalizeText, tokenizeText }
