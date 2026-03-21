import { RustdocParseError } from "../errors.ts"
import type { RustdocItem, RustdocItemKind, RustdocJson } from "./types.ts"

const ensureRoot = (json: RustdocJson) => {
	if (!(json.root && json.index && json.paths)) {
		throw new RustdocParseError("Invalid rustdoc JSON structure: missing root, index, or paths")
	}

	const root = json.index[json.root]
	if (!root) {
		throw new RustdocParseError(`Root item '${json.root}' not found in index`)
	}

	return root
}

const getKindFromItem = (item: RustdocItem): RustdocItemKind | undefined => {
	if (!item.inner) {
		return
	}
	if (item.inner.module) {
		return "module"
	}
	if (item.inner.struct) {
		return "struct"
	}
	if (item.inner.enum) {
		return "enum"
	}
	if (item.inner.function) {
		return "function"
	}
	if (item.inner.trait) {
		return "trait"
	}
	if (item.inner.typedef) {
		return "typedef"
	}
	if (item.inner.impl) {
		return "impl"
	}

	return
}

export { ensureRoot, getKindFromItem }
