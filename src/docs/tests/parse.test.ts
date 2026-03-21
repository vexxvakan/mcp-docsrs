import { describe, expect, test } from "bun:test"
import { DecompressionError, JsonParseError } from "../../errors.ts"
import { decodeBytes, parseRustdoc } from "../parse.ts"
import { createStoreJson, toResponse } from "./fixtures.ts"

const TEST_URL = "https://docs.rs/test"
const INVALID_ZSTD_BYTES = new TextEncoder().encode("not-zstd")

describe("parse", () => {
	describe("decodeBytes", () => {
		test("decodes correct bytes", async () => {
			const compressed = await Bun.zstdCompress("hello")
			const bytes = await new Response(compressed).arrayBuffer()
			const data = await decodeBytes(bytes, TEST_URL, "zstd")

			expect(data).toBe("hello")
		})

		test("throws empty bytes", async () => {
			try {
				await decodeBytes(new ArrayBuffer(0), TEST_URL, "zstd")
				throw new Error("Expected decodeBytes to throw for empty bytes")
			} catch (error) {
				expect(error).toBeInstanceOf(JsonParseError)
			}
		})

		test("throws empty encoding", async () => {
			try {
				await decodeBytes(new ArrayBuffer(1), TEST_URL, null)
				throw new Error("Expected decodeBytes to throw for empty encoding")
			} catch (error) {
				expect(error).toBeInstanceOf(JsonParseError)
			}
		})

		test("throws non-zstd encoding", async () => {
			try {
				await decodeBytes(new ArrayBuffer(1), TEST_URL, "gzip")
				throw new Error("Expected decodeBytes to throw for non-zstd encoding")
			} catch (error) {
				expect(error).toBeInstanceOf(DecompressionError)
			}
		})

		test("throws invalid buffer", async () => {
			try {
				await decodeBytes(await new Response(INVALID_ZSTD_BYTES).arrayBuffer(), TEST_URL, "zstd")
				throw new Error("Expected decodeBytes to throw for invalid buffer")
			} catch (error) {
				expect(error).toBeInstanceOf(DecompressionError)
			}
		})
	})

	describe("parseRustdoc", () => {
		test("creates correct json payload", async () => {
			const compressed = await Bun.zstdCompress(JSON.stringify(createStoreJson()))
			const data = await parseRustdoc(toResponse(compressed, "zstd"), TEST_URL)

			expect(data.root).toBe(0)
			expect(data.index["0"]?.name).toBe("demo")
			expect(data.index["1"]?.name).toBe("connect")
		})

		test("throws invalid payload", async () => {
			try {
				const compressed = await Bun.zstdCompress("{}")
				await parseRustdoc(toResponse(compressed, "zstd"), TEST_URL)
				throw new Error("Expected parseRustdoc to throw for invalid payload")
			} catch (error) {
				expect(error).toBeInstanceOf(JsonParseError)
			}
		})
	})
})
