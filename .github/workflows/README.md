# GitHub Workflows Documentation

## Overview

This repository uses optimized GitHub Actions workflows designed for open-source projects to minimize resource usage while maintaining quality.

## Workflow Strategy

### For Pull Requests

- **Minimal checks only** (Linux, essential tests)
- **No resource-heavy scans** on every PR
- **Use `full-ci` label** to trigger complete pipeline

### For Main Branch

- **Full CI/CD pipeline** with all platforms
- **Security scans** on code changes
- **Automated releases** with changelogs

## Structure

```text
.github/
├── workflows/
│   ├── pr-ci.yml                    # Fast PR validation (Linux only)
│   ├── ci.yml                       # Full CI/CD pipeline (main + labeled PRs)
│   ├── release.yml                  # Release automation with changelogs
│   ├── security.yml                 # Security scanning (scheduled + main)
│   ├── codeql.yml                   # CodeQL analysis (weekly schedule)
│   ├── dependency-update.yml        # Bun lockfile updates
│   ├── pr-automation.yml            # PR labeling and stale checks
│   ├── test-workflow.yml            # Reusable: Test suite across platforms
│   ├── build-workflow.yml           # Reusable: Build executables
│   ├── code-quality-workflow.yml    # Reusable: Linting, type checking
│   ├── integration-test-workflow.yml # Reusable: Integration testing
│   └── README.md                    # This file
├── codeql/
│   └── codeql-config.yml           # CodeQL configuration
├── dependabot.yml                  # Automated dependency updates
├── labeler.yml                     # PR auto-labeling rules
├── secret-scanning.yml             # Secret scanning config
└── scripts/
    └── generate-changelog.sh       # Changelog generation script
```

## Main Workflows

### PR Quick Checks (`pr-ci.yml`)

- **Triggers**: All PRs (except docs-only changes)
- **Purpose**: Fast validation on Linux only
- **Jobs**: Lint → Type Check → Test → Build
- **Runtime**: ~2-3 minutes

### Full CI/CD Pipeline (`ci.yml`)

- **Triggers**: Push to main, PRs with `full-ci` label
- **Purpose**: Complete validation across all platforms
- **Jobs**: Test → Build → Quality → Integration → Status Check
- **Note**: Add `full-ci` label to PR for full platform testing

### Release Automation (`release.yml`)

- **Trigger**: Manual dispatch with version selection
- **Purpose**: Automated releases with professional changelogs
- **Features**:
  - Semantic version bumping (major/minor/patch/custom)
  - Beautiful changelog with categorized commits
  - First-time contributor recognition
  - Multi-platform binary builds
  - SHA256 checksums for all artifacts
  - GitHub Release creation with download links
  - Pre-release support

### Security Scanning (`security.yml`)

- **Triggers**: Push to main (code changes), weekly schedule
- **Purpose**: Comprehensive security analysis
- **Features**:
  - Dependency vulnerability scanning
  - License compliance checking
  - Semgrep SAST analysis
  - Secret scanning with Gitleaks
  - TypeScript strict security checks

### CodeQL Analysis (`codeql.yml`)

- **Triggers**:
  - PRs with `codeql` label
  - Push to main (code changes only)
  - Monthly schedule (backup)
  - Manual dispatch
- **Purpose**: Deep semantic security analysis
- **Note**: Resource-intensive, use `codeql` label to run on PRs

### Dependency Updates (`dependency-update.yml`)

- **Triggers**: Dependabot PRs, monthly schedule
- **Purpose**: Bun-specific dependency management
- **Features**:
  - Automatic Bun lockfile updates on Dependabot PRs
  - Monthly outdated dependency reports
  - Bun compatibility validation

### PR Automation (`pr-automation.yml`)

- **Triggers**: PR events, weekly stale check
- **Purpose**: Automate PR management
- **Features**:
  - Auto-labeling by file type and size
  - Weekly stale PR/issue checks
  - First-time contributor welcome (only with label)
- **Note**: Minimal automation to avoid spam

## Reusable Workflows

### Test Suite (`test-workflow.yml`)

- Runs tests on Ubuntu, macOS, and Windows
- Tests with Bun 1.2.14 and latest
- Uploads coverage to Codecov

### Build (`build-workflow.yml`)

- Builds executables for all 7 platforms:
  - Linux x64/ARM64 (GLIBC and MUSL variants) 
  - macOS x64/ARM64 (Intel and Apple Silicon)
  - Windows x64
- All builds include bytecode compilation for faster startup
- Uploads artifacts for 7 days

### Code Quality (`code-quality-workflow.yml`)

- Runs Biome linter
- TypeScript type checking
- Security vulnerability scanning
- Bundle size analysis

### Integration Tests (`integration-test-workflow.yml`)

- Tests built executables on their native platforms
- Validates MCP server functionality
- Tests all 7 platform builds
- Runs on main branch and PRs with full-ci label

## Key Differences: pr-ci.yml vs ci.yml

### pr-ci.yml (Quick Checks)

- **Purpose**: Fast feedback for every PR
- **Scope**: Minimal validation
- **Platform**: Ubuntu Linux only
- **Jobs**: Single job with lint, typecheck, test, build
- **When**: Every PR automatically

### ci.yml (Full Pipeline)

- **Purpose**: Comprehensive validation
- **Scope**: Full test matrix and integration tests
- **Platforms**: Ubuntu, macOS, Windows
- **Jobs**: Parallel test/build/quality jobs, then integration tests
- **Runtime**: ~15-20 minutes (all platforms)
- **When**: Push to main OR PRs with "full-ci" label

## Adding New Workflows

1. Create new reusable workflow with `workflow_call` trigger
2. Place in main `workflows/` directory with `-workflow` suffix
3. Reference from main workflows using `uses: ./.github/workflows/name-workflow.yml`
4. Pass secrets with `secrets: inherit`

## Environment Variables

- `BUN_VERSION`: Default Bun version (1.2.14)
- `NODE_VERSION`: Node.js version for compatibility

## Secrets Required

- `CODECOV_TOKEN`: For coverage reporting (optional)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Dependency Management

### Dependabot Configuration

Located in `.github/dependabot.yml`:

- **Package Updates**: Weekly checks for Bun/npm dependencies
- **GitHub Actions**: Monthly updates for workflow actions
- **Grouped Updates**: Development and production dependencies
- **Auto-merge**: Patch updates for production, minor+patch for dev

### Bun Compatibility

Since Dependabot doesn't natively support Bun yet:

1. Dependabot creates PRs based on `package.json`
2. Our `dependency-update.yml` workflow automatically updates `bun.lock`
3. All dependencies are validated for Bun compatibility

## Resource Usage Optimization

This workflow setup is optimized for open-source projects:

- **PRs run minimal checks** (Linux only, ~2-3 min)
- **Full CI requires label** (`full-ci`) to prevent abuse
- **Security scans on schedule** not every PR
- **Stale checks weekly** not daily
- **Path filters** skip workflows for docs changes

## Triggering Special Workflows on PRs

### Full CI Pipeline

1. Add the `full-ci` label to the PR
2. The complete test matrix will run across all platforms

### CodeQL Security Analysis

1. Add the `codeql` label to the PR
2. Deep semantic security analysis will run

## Running a Release

1. Go to Actions → Release Automation
2. Click "Run workflow"
3. Select release type:
   - `patch`: Bug fixes (1.0.0 → 1.0.1)
   - `minor`: New features (1.0.0 → 1.1.0)
   - `major`: Breaking changes (1.0.0 → 2.0.0)
   - `custom`: Specify exact version
4. Optionally mark as pre-release
5. Workflow will:
   - Update version in package.json
   - Generate comprehensive changelog
   - Build all platform binaries
   - Create GitHub Release with artifacts

## Commit Message Format

For best changelog generation, use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `perf:` Performance improvements
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `build:` Build system changes
- `chore:` Maintenance tasks

Add `!` for breaking changes: `feat!: new API`

## Workflow Issues Fixed

Recent improvements to the workflow structure:

1. **Fixed workflow references**: Moved all reusable workflows to top-level directory (GitHub Actions requirement)
2. **Fixed label detection**: Changed from `github.event.label.name` to `github.event.pull_request.labels.*.name` for proper PR label checking
3. **Fixed job dependencies**: Added `integration-test` to `status-check` dependencies
4. **Improved status checks**: Handle skipped jobs properly in CI status validation
