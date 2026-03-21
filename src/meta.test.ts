import { describe, expect, test } from "bun:test"
import { resolveAppVersion } from "./meta.ts"

describe("resolveAppVersion", () => {
	test("uses version", () => {
		const version = resolveAppVersion("1.2.3")

		expect(version).toBe("1.2.3")
	})

	test("uses fallback", () => {
		const version = resolveAppVersion()

		expect(version).toBe("dev")
	})
})
