#!/bin/bash

# Generate changelog for release
# Usage: ./generate-changelog.sh [previous-tag] [new-version]

set -e

PREVIOUS_TAG=${1:-$(git describe --tags --abbrev=0 2>/dev/null || echo "")}
NEW_VERSION=${2:-"NEXT"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Generating changelog for version ${NEW_VERSION}...${NC}"

# Initialize arrays for categorization
declare -a FEATURES=()
declare -a FIXES=()
declare -a DOCS=()
declare -a BREAKING=()
declare -a PERF=()
declare -a REFACTOR=()
declare -a TEST=()
declare -a BUILD=()
declare -a CHORE=()
declare -A CONTRIBUTORS=()
declare -A FIRST_TIMERS=()

# Get all commits since last tag
if [ -z "$PREVIOUS_TAG" ]; then
    COMMITS=$(git log --pretty=format:"%H|%s|%an|%ae" --no-merges)
else
    COMMITS=$(git log ${PREVIOUS_TAG}..HEAD --pretty=format:"%H|%s|%an|%ae" --no-merges)
fi

# Process each commit
while IFS='|' read -r HASH MSG AUTHOR EMAIL; do
    # Track contributors
    CONTRIBUTORS["$AUTHOR"]="$EMAIL"

    # Check if first time contributor
    PREV_COMMITS=$(git log --author="$EMAIL" --pretty=format:"%H" | grep -v "$HASH" | wc -l)
    if [ "$PREV_COMMITS" -eq 0 ]; then
        FIRST_TIMERS["$AUTHOR"]="$EMAIL"
    fi

    # Categorize by conventional commit type
    if [[ "$MSG" =~ ^feat(\(.*\))?!?:(.*)$ ]]; then
        FEATURES+=("$HASH|$MSG|$AUTHOR")
        [[ "$MSG" =~ ! ]] && BREAKING+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^fix(\(.*\))?:(.*)$ ]]; then
        FIXES+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^docs(\(.*\))?:(.*)$ ]]; then
        DOCS+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^perf(\(.*\))?:(.*)$ ]]; then
        PERF+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^refactor(\(.*\))?:(.*)$ ]]; then
        REFACTOR+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^test(\(.*\))?:(.*)$ ]]; then
        TEST+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^build(\(.*\))?:(.*)$ ]]; then
        BUILD+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ ^chore(\(.*\))?:(.*)$ ]]; then
        CHORE+=("$HASH|$MSG|$AUTHOR")
    elif [[ "$MSG" =~ BREAKING ]]; then
        BREAKING+=("$HASH|$MSG|$AUTHOR")
    else
        CHORE+=("$HASH|$MSG|$AUTHOR")
    fi
done <<<"$COMMITS"

# Generate changelog
{
    echo "# 🎉 Release v${NEW_VERSION}"
    echo ""
    echo "> Released on $(date +"%B %d, %Y")"
    echo ""

    # Highlights
    if [ ${#FEATURES[@]} -gt 0 ] || [ ${#FIXES[@]} -gt 0 ]; then
        echo "## ✨ Highlights"
        echo ""

        # Top 3 features
        COUNT=0
        for item in "${FEATURES[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^feat(\(.*\))?!?:\s*//')
            echo "- 🚀 $CLEAN_MSG"
            COUNT=$((COUNT + 1))
            [ $COUNT -eq 3 ] && break
        done

        # Important fixes
        COUNT=0
        for item in "${FIXES[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^fix(\(.*\))?:\s*//')
            echo "- 🔧 $CLEAN_MSG"
            COUNT=$((COUNT + 1))
            [ $COUNT -eq 2 ] && break
        done
        echo ""
    fi

    # Breaking changes
    if [ ${#BREAKING[@]} -gt 0 ]; then
        echo "## ⚠️ BREAKING CHANGES"
        echo ""
        for item in "${BREAKING[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^[a-z]+(\(.*\))?!?:\s*//')
            SHORT_HASH=${HASH:0:7}
            echo "- $CLEAN_MSG ([${SHORT_HASH}](../../commit/${HASH})) by @${AUTHOR}"
        done
        echo ""
    fi

    # What's Changed
    echo "## 🎯 What's Changed"
    echo ""

    # Features
    if [ ${#FEATURES[@]} -gt 0 ]; then
        echo "### 🚀 Features"
        for item in "${FEATURES[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^feat(\(.*\))?!?:\s*//')
            SHORT_HASH=${HASH:0:7}
            echo "- $CLEAN_MSG ([${SHORT_HASH}](../../commit/${HASH})) @${AUTHOR}"
        done
        echo ""
    fi

    # Performance
    if [ ${#PERF[@]} -gt 0 ]; then
        echo "### ⚡ Performance"
        for item in "${PERF[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^perf(\(.*\))?:\s*//')
            SHORT_HASH=${HASH:0:7}
            echo "- $CLEAN_MSG ([${SHORT_HASH}](../../commit/${HASH})) @${AUTHOR}"
        done
        echo ""
    fi

    # Bug Fixes
    if [ ${#FIXES[@]} -gt 0 ]; then
        echo "### 🐛 Bug Fixes"
        for item in "${FIXES[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^fix(\(.*\))?:\s*//')
            SHORT_HASH=${HASH:0:7}
            echo "- $CLEAN_MSG ([${SHORT_HASH}](../../commit/${HASH})) @${AUTHOR}"
        done
        echo ""
    fi

    # Documentation
    if [ ${#DOCS[@]} -gt 0 ]; then
        echo "### 📚 Documentation"
        for item in "${DOCS[@]}"; do
            IFS='|' read -r HASH MSG AUTHOR <<<"$item"
            CLEAN_MSG=$(echo "$MSG" | sed -E 's/^docs(\(.*\))?:\s*//')
            SHORT_HASH=${HASH:0:7}
            echo "- $CLEAN_MSG ([${SHORT_HASH}](../../commit/${HASH})) @${AUTHOR}"
        done
        echo ""
    fi

    # First Time Contributors
    if [ ${#FIRST_TIMERS[@]} -gt 0 ]; then
        echo "## 🌟 First Time Contributors"
        echo ""
        echo "We'd like to welcome the following contributors who made their first contribution! 🎊"
        echo ""
        for author in "${!FIRST_TIMERS[@]}"; do
            echo "- @${author}"
        done
        echo ""
    fi

    # Statistics
    TOTAL_COMMITS=$(echo "$COMMITS" | wc -l)
    TOTAL_CONTRIBUTORS=${#CONTRIBUTORS[@]}

    echo "## 📊 Release Stats"
    echo ""
    echo "- 📝 **${TOTAL_COMMITS}** commits"
    echo "- 👥 **${TOTAL_CONTRIBUTORS}** contributors"
    echo "- 🌟 **${#FIRST_TIMERS[@]}** first-time contributors"

    # File stats if available
    if [ -n "$PREVIOUS_TAG" ]; then
        FILES_CHANGED=$(git diff --name-only ${PREVIOUS_TAG}..HEAD | wc -l)
        INSERTIONS=$(git diff --shortstat ${PREVIOUS_TAG}..HEAD | grep -oE '[0-9]+ insertions' | grep -oE '[0-9]+' || echo "0")
        DELETIONS=$(git diff --shortstat ${PREVIOUS_TAG}..HEAD | grep -oE '[0-9]+ deletions' | grep -oE '[0-9]+' || echo "0")

        echo "- 📁 **${FILES_CHANGED}** files changed"
        echo "- ➕ **${INSERTIONS}** additions"
        echo "- ➖ **${DELETIONS}** deletions"
    fi
    echo ""
}

echo -e "${GREEN}Changelog generated successfully!${NC}"
