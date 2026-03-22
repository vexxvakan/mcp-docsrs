import { createPromptResult, createTargetText, createVersionText } from "../../shared.ts"
import type { PromptHandler } from "../../types.ts"
import type { SymbolLookupPromptArgs } from "./types.ts"

const createLookupSymbolPromptHandler = (): PromptHandler<SymbolLookupPromptArgs> => (args) => {
	if (!(args.crateName || args.symbolname || args.symbolType)) {
		return createPromptResult(
			'I need the crate name, symbol type, and symbol name. For example: crateName "tokio", symbolType "struct", symbolname "runtime::Runtime".'
		)
	}
	if (!args.crateName) {
		return createPromptResult(
			`Which Rust crate contains the ${args.symbolType ?? "symbol"} "${args.symbolname ?? "unknown"}"? Please provide the crate name.`
		)
	}
	if (!args.symbolType) {
		return createPromptResult(
			`What rustdoc symbol type should I use for "${args.symbolname ?? "this symbol"}" in the crate "${args.crateName}"? For example "struct", "function", or "trait".`
		)
	}
	if (!args.symbolname) {
		return createPromptResult(
			`What symbol name or path from the "${args.crateName}" crate would you like me to inspect as a ${args.symbolType}?`
		)
	}

	return createPromptResult(
		`Please inspect the ${args.symbolType} "${args.symbolname}" from the Rust crate "${args.crateName}"${createVersionText(args.version)}${createTargetText(args.target)} using the symbol_lookup tool. Summarize its purpose, the high-level symbol metadata, related items, and any notable constraints or caveats. Use symbol_docs only if the full documentation body is needed.`
	)
}

export { createLookupSymbolPromptHandler }
