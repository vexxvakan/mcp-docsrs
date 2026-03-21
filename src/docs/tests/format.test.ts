// biome-ignore-all lint/style/useNamingConvention: rustdoc fixtures use upstream snake_case keys
import { describe, expect, test } from "bun:test"
import { formatCrate, formatItem } from "../format.ts"
import { ensureRoot } from "../shared.ts"
import { createQueryJson } from "./fixtures.ts"

describe("format", () => {
	describe("formatCrate", () => {
		test("creates crate output from prepared buckets", () => {
			const json = createQueryJson()
			const root = ensureRoot(json)
			const content = formatCrate(json, root, {
				enums: [
					"- **Mode**: Modes for the runtime"
				],
				functions: [
					"- **connect**: Connect to the backend"
				],
				modules: [
					"- **net**: Networking tools"
				],
				structs: [
					"- **Client**: Demo struct"
				],
				traits: [
					"- **Handler**: Handles requests"
				]
			})

			expect(content).toContain("# Crate: demo v1.2.3")
			expect(content).toContain("## Documentation\nRoot crate docs")
			expect(content).toContain("## Modules\n- **net**: Networking tools")
			expect(content).toContain("## Structs\n- **Client**: Demo struct")
			expect(content).toContain("## Enums\n- **Mode**: Modes for the runtime")
			expect(content).toContain("## Traits\n- **Handler**: Handles requests")
			expect(content).toContain("## Functions\n- **connect**: Connect to the backend")
		})

		test("omits empty sections", () => {
			const json = createQueryJson()
			const root = ensureRoot(json)
			const content = formatCrate(json, root, {
				enums: [],
				functions: [],
				modules: [],
				structs: [],
				traits: []
			})

			expect(content).toContain("# Crate: demo v1.2.3")
			expect(content).toContain("## Documentation\nRoot crate docs")
			expect(content).not.toContain("## Modules")
			expect(content).not.toContain("## Structs")
			expect(content).not.toContain("## Enums")
			expect(content).not.toContain("## Traits")
			expect(content).not.toContain("## Functions")
		})
	})

	describe("formatItem", () => {
		test("formats function details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.function_item, "function")

			expect(content).toContain("# connect")
			expect(content).toContain("**Type:** Function")
			expect(content).toContain("**Attributes:** const, async, unsafe")
		})

		test("formats enum details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.enum_item, "enum")

			expect(content).toContain("# Mode")
			expect(content).toContain("**Type:** Enum")
			expect(content).toContain("**Variants:** 2")
			expect(content).toContain("**Implementations:** 1")
		})

		test("formats trait details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.trait_item, "trait")

			expect(content).toContain("# Handler")
			expect(content).toContain("**Type:** Trait")
			expect(content).toContain("**Attributes:** auto, unsafe")
			expect(content).toContain("**Items:** 2")
		})

		test("formats implementation details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.impl_item, "impl")

			expect(content).toContain("# ClientImpl")
			expect(content).toContain("**Type:** Implementation")
		})

		test("formats unknown item kind", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.empty_inner_item)

			expect(content).toContain("# EmptyInner")
			expect(content).toContain("**Type:** Unknown")
		})

		test("formats deprecated item details", () => {
			const json = createQueryJson()
			const content = formatItem(json.index.unknown_item)

			expect(content).toContain("# Mystery")
			expect(content).toContain("**Type:** Unknown")
			expect(content).toContain("**Visibility:** crate")
			expect(content).toContain("**Deprecated:** yes")
		})
	})
})
