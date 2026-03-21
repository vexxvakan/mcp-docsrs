const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const DAYS_PER_WEEK = 7
const WEEK = DAYS_PER_WEEK * DAY
const DAYS_PER_MONTH = 30.4375
const MONTH = DAYS_PER_MONTH * DAY
const DAYS_PER_YEAR = 365.25
const YEAR = DAYS_PER_YEAR * DAY
const YEARS_PER_DECADE = 10
const DECADE = YEARS_PER_DECADE * YEAR

type RelativeTimeOptions = {
	includeAbsolute?: boolean
	locale?: string
	now?: Date | number
}

type RelativeUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year"

const getNowMs = (now: RelativeTimeOptions["now"]) => {
	if (typeof now === "number") {
		return now
	}

	if (now instanceof Date) {
		return now.getTime()
	}

	return Date.now()
}

const formatAbsoluteDate = (date: Date, locale: string) =>
	new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric"
	}).format(date)

const resolveRelativeUnit = (
	diffMs: number
): {
	unit: RelativeUnit
	value: number
} => {
	const absMs = Math.abs(diffMs)

	if (absMs >= YEAR) {
		return {
			unit: "year",
			value: Math.round(diffMs / YEAR)
		}
	}
	if (absMs >= MONTH) {
		return {
			unit: "month",
			value: Math.round(diffMs / MONTH)
		}
	}
	if (absMs >= WEEK) {
		return {
			unit: "week",
			value: Math.round(diffMs / WEEK)
		}
	}
	if (absMs >= DAY) {
		return {
			unit: "day",
			value: Math.round(diffMs / DAY)
		}
	}
	if (absMs >= HOUR) {
		return {
			unit: "hour",
			value: Math.round(diffMs / HOUR)
		}
	}
	if (absMs >= MINUTE) {
		return {
			unit: "minute",
			value: Math.round(diffMs / MINUTE)
		}
	}
	return {
		unit: "second",
		value: Math.round(diffMs / SECOND)
	}
}

const formatDecades = (date: Date, diffMs: number, locale: string, includeAbsolute: boolean) => {
	const decades = Math.round(diffMs / DECADE)
	const amount = Math.abs(decades)
	const text = `${amount} decade${amount === 1 ? "" : "s"} ${decades < 0 ? "ago" : "from now"}`

	if (!includeAbsolute) {
		return text
	}

	return `${text} (${formatAbsoluteDate(date, locale)})`
}

const formatRelativeDate = (
	input: string | number | Date,
	options: RelativeTimeOptions = {}
): string => {
	const locale = options.locale ?? "en"
	const includeAbsolute = options.includeAbsolute ?? false
	const date = input instanceof Date ? input : new Date(input)
	const targetMs = date.getTime()

	if (Number.isNaN(targetMs)) {
		return "invalid date"
	}

	const diffMs = targetMs - getNowMs(options.now)
	if (Math.abs(diffMs) >= DECADE) {
		return formatDecades(date, diffMs, locale, includeAbsolute)
	}

	const { unit, value } = resolveRelativeUnit(diffMs)
	const relative = new Intl.RelativeTimeFormat(locale, {
		numeric: "always",
		style: "long"
	}).format(value, unit)

	if (!includeAbsolute) {
		return relative
	}

	return `${relative} (${formatAbsoluteDate(date, locale)})`
}

export { formatRelativeDate }
