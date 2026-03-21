import type { ZodBoolean, ZodDefault, ZodOptional, ZodString } from "zod"

type LookupSymbolArgs = {
	crateName: string
	expandDocs: boolean
	symbolType: string
	symbolname: string
	target?: string
	version?: string
}

type LookupSymbolInputSchema = {
	crateName: ZodString
	expandDocs: ZodDefault<ZodOptional<ZodBoolean>>
	symbolType: ZodString
	symbolname: ZodString
	target: ZodOptional<ZodString>
	version: ZodOptional<ZodString>
}

export type { LookupSymbolArgs, LookupSymbolInputSchema }
