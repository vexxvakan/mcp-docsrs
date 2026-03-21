import type { ZodDefault, ZodNumber, ZodOptional, ZodString } from "zod"

type CrateArgs = {
	crateName: string
	formatVersion?: number
	target?: string
	version?: string
}

type CrateInputSchema = {
	crateName: ZodString
	formatVersion: ZodOptional<ZodNumber>
	target: ZodOptional<ZodString>
	version: ZodOptional<ZodString>
}

type FindCratesArgs = {
	limit?: number
	query: string
}

type FindCratesInputSchema = {
	limit: ZodDefault<ZodOptional<ZodNumber>>
	query: ZodString
}

export type { CrateArgs, CrateInputSchema, FindCratesArgs, FindCratesInputSchema }
