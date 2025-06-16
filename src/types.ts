import { z } from 'zod';

// Zod schemas for tool parameters - raw shapes
export const lookupCrateShape = {
  crateName: z.string().describe('Name of the Rust crate to lookup documentation for'),
  version: z.string().optional().describe('Specific version (e.g., "1.0.0") or semver range (e.g., "~4")'),
  target: z.string().optional().describe('Target platform (e.g., "i686-pc-windows-msvc")'),
  formatVersion: z.number().optional().describe('Rustdoc JSON format version')
};

export const lookupItemShape = {
  crateName: z.string().describe('Name of the Rust crate'),
  itemPath: z.string().describe('Path to specific item (e.g., "struct.MyStruct" or "fn.my_function")'),
  version: z.string().optional().describe('Specific version or semver range'),
  target: z.string().optional().describe('Target platform')
};

// Zod schemas as objects
export const lookupCrateSchema = z.object(lookupCrateShape);
export const lookupItemSchema = z.object(lookupItemShape);

// Type inference
export type LookupCrateArgs = z.infer<typeof lookupCrateSchema>;
export type LookupItemArgs = z.infer<typeof lookupItemSchema>;

// Response types
export type DocsResponse = {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  [key: string]: unknown;
}

// Cache types
export type CacheEntry = {
  data: any;
  timestamp: number;
  ttl: number;
}

// Generic cache entry type
export type CacheEntryGeneric<T> = {
  data: T;
  timestamp: number;
  ttl: number;
}

// Config types
export type ServerConfig = {
  cacheTtl?: number;
  maxCacheSize?: number;
  requestTimeout?: number;
}

// Rustdoc JSON format types
export type RustdocItem = {
  id: string;
  crate_id: number;
  name?: string;
  span?: any;
  visibility: "public" | "default" | "crate" | "restricted";
  docs?: string;
  attrs?: string[];
  deprecation?: any;
  inner?: RustdocItemInner;
  links?: Record<string, string>;
}

export type RustdocItemInner = {
  // Module
  module?: {
    is_crate: boolean;
    items: string[];
  };
  // Struct
  struct?: {
    struct_type: "plain" | "tuple" | "unit";
    generics?: any;
    fields_stripped?: boolean;
    fields?: string[];
    impls?: string[];
  };
  // Enum
  enum?: {
    generics?: any;
    variants_stripped?: boolean;
    variants?: string[];
    impls?: string[];
  };
  // Function
  function?: {
    decl: any;
    generics?: any;
    header?: any;
  };
  // Trait
  trait?: {
    is_auto: boolean;
    is_unsafe: boolean;
    items: string[];
    generics?: any;
    bounds?: any[];
    implementations?: string[];
  };
  // Type alias
  typedef?: {
    type: any;
    generics?: any;
  };
  // Impl
  impl?: {
    is_unsafe: boolean;
    generics?: any;
    provided_trait_methods?: string[];
    trait?: any;
    for?: any;
    items: string[];
  };
}

export type RustdocJson = {
  root: string;
  crate_version?: string;
  includes_private: boolean;
  format_version: number;
  index: Record<string, RustdocItem>;
  paths: Record<
    string,
    {
      crate_id: number;
      path: string[];
      kind: string;
    }
  >;
  external_crates: Record<
    string,
    {
      name: string;
      html_root_url?: string;
    }
  >;
}