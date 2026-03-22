// biome-ignore-all lint/style/useNamingConvention: rustdoc crate section keys mirror upstream snake_case kinds

import type { Item } from "../rustdoc/types/items.ts"

const formatCrateDocs = (root: Item) => root.docs ?? "No crate-level documentation available."

export { formatCrateDocs }
