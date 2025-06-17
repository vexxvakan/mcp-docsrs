# GitHub Workflows Documentation

## Structure

This repository uses a modular workflow structure for better maintainability:

```text
.github/
├── workflows/
│   ├── ci.yml                 # Main CI/CD pipeline orchestrator
│   ├── release.yml            # Release automation with changelogs
│   ├── security.yml           # Security scanning and audits
│   ├── dependency-update.yml  # Bun-specific dependency management
│   ├── jobs/                  # Reusable workflow components
│   │   ├── test.yml          # Test suite across platforms
│   │   ├── build.yml         # Build executables for all platforms
│   │   ├── code-quality.yml  # Linting, type checking, security
│   │   ├── integration-test.yml # Integration testing
│   │   └── setup.yml         # Common setup steps (optional)
│   └── README.md             # This file
├── dependabot.yml            # Automated dependency updates
└── scripts/
    └── generate-changelog.sh # Changelog generation script
```

## Main Workflows

### CI/CD Pipeline (`ci.yml`)

- **Triggers**: Push to main, PRs, manual dispatch
- **Purpose**: Orchestrates all CI jobs
- **Jobs**: Test → Build → Quality → Integration → Status Check

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

- **Triggers**: Push, PRs, daily schedule, manual
- **Purpose**: Comprehensive security analysis
- **Features**:
  - Dependency vulnerability scanning
  - License compliance checking
  - Static Application Security Testing (SAST)
  - Secret scanning with Gitleaks
  - Security report summaries

### Dependency Updates (`dependency-update.yml`)

- **Triggers**: Dependabot PRs, weekly schedule, manual
- **Purpose**: Bun-specific dependency management
- **Features**:
  - Automatic Bun lockfile updates on Dependabot PRs
  - Weekly outdated dependency reports
  - Bun compatibility validation
  - Automated issue creation for updates

## Reusable Workflows

### Test Suite (`jobs/test.yml`)

- Runs tests across Ubuntu, macOS, Windows
- Tests with Bun 1.2.14 and latest
- Uploads coverage to Codecov

### Build (`jobs/build.yml`)

- Builds platform-specific executables
- Creates bytecode version for faster startup
- Uploads artifacts for 7 days

### Code Quality (`jobs/code-quality.yml`)

- Runs Biome linter
- TypeScript type checking
- Security vulnerability scanning
- Bundle size analysis

### Integration Tests (`jobs/integration-test.yml`)

- Tests built executables
- Validates MCP server functionality
- Runs only on main branch

## Adding New Workflows

1. Create new reusable workflow in `jobs/` directory
2. Use `workflow_call` trigger
3. Reference from main workflows using `uses: ./.github/workflows/jobs/name.yml`
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
2. Our `dependency-update.yml` workflow automatically updates `bun.lockb`
3. All dependencies are validated for Bun compatibility

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
