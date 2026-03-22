import { createPromptResult, createTargetText, createVersionText } from "../../shared.ts"
import type { PromptHandler } from "../../types.ts"
import type { SymbolDocsPromptArgs } from "./types.ts"

const createSymbolDocsPromptHandler = (): PromptHandler<SymbolDocsPromptArgs> => (args) => {
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
			`What symbol name or path from the "${args.crateName}" crate would you like me to retrieve docs for as a ${args.symbolType}?`
		)
	}

	return createPromptResult(
		`Please retrieve the full documentation for the ${args.symbolType} "${args.symbolname}" from the Rust crate "${args.crateName}"${createVersionText(args.version)}${createTargetText(args.target)} using the symbol_docs tool. Focus on the primary usage guidance, important fields or parameters, related items, and any notable caveats.`
	)
}

export { createSymbolDocsPromptHandler }
