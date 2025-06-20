#!/bin/sh
# Integration test script for MUSL builds with extended tests
# This runs inside Alpine Linux container with Bun support

set -e

EXECUTABLE=$1
TARGET=$2
WORKSPACE_DIR=$(dirname $(dirname $(dirname $(readlink -f "$0"))))

echo "🧪 Running MUSL integration tests for $TARGET"
echo "📦 Executable: $EXECUTABLE"
echo "📂 Workspace: $WORKSPACE_DIR"

# Verify Bun is available (should be pre-installed in Docker image)
if ! command -v bun >/dev/null 2>&1; then
    echo "❌ Bun not found! Please ensure the Docker image has Bun installed."
    exit 1
fi

echo "✅ Bun version: $(bun --version)"

# Change to workspace directory
cd "$WORKSPACE_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Run the full TypeScript test suite with --musl flag
echo "🧪 Running full integration test suite..."
bun test/integration/test-binary.ts "$EXECUTABLE" "$TARGET" --musl

echo -e "\n✅ All MUSL integration tests passed for $TARGET"
