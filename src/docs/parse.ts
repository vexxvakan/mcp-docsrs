import { DecompressionError, JsonParseError } from "../errors.ts"
import type { RustdocJson } from "./types.ts"

const TEXT_DECODER = new TextDecoder()

const decodeBytes = async (buffer: ArrayBuffer, url: string, encoding: string | null) => {
	if (buffer.byteLength === 0) {
		throw new JsonParseError(new Error("Empty response body"), url)
	}
	if (!encoding) {
		throw new JsonParseError(new Error("Empty content-encoding"), url)
	}
	if (encoding !== "zstd") {
		throw new DecompressionError(url, encoding, "Unsupported content encoding")
	}

	try {
		return TEXT_DECODER.decode(await Bun.zstdDecompress(buffer))
	} catch (error) {
		throw new DecompressionError(url, encoding, (error as Error).message)
	}
}

const parseRustdoc = async (response: Response, url: string) => {
	try {
		const raw = await decodeBytes(
			await response.arrayBuffer(),
			url,
			response.headers.get("content-encoding") ?? "zstd"
		)

		const payload = JSON.parse(raw) as RustdocJson
		if (payload.root === undefined || !payload.index || !payload.paths) {
			throw new Error("Invalid payload")
		}

		return payload
	} catch (error) {
		if (error instanceof DecompressionError || error instanceof JsonParseError) {
			throw error
		}

		throw new JsonParseError(error as Error, url)
	}
}

export { decodeBytes, parseRustdoc }
