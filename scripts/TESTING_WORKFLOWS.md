# Testing GitHub Workflows Locally

This guide explains how to test our GitHub Actions workflows locally using `act`, with special considerations for Docker registry operations.

## Prerequisites

1. Install `act`: https://github.com/nektos/act

   ```bash
   # macOS
   brew install act

   # Or using the install script
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   ```

2. Install Docker (required by act)

## Testing Build Workflow

The build workflow is safe to test locally as it only creates artifacts:

```bash
# Test the entire build workflow
act -W .github/workflows/build-workflow.yml

# Test specific job
act -W .github/workflows/build-workflow.yml -j build

# Test with specific matrix combination
act -W .github/workflows/build-workflow.yml --matrix os:ubuntu-latest --matrix target:linux-x64
```

## Testing Release Workflow (with Docker Publishing)

⚠️ **WARNING**: The release workflow publishes to registries. Use these safety measures:

### 1. Dry Run Mode (Recommended)

Create a test workflow that skips actual publishing:

```bash
# Create a test version of the workflow
cp .github/workflows/release.yml .github/workflows/release-test.yml
```

Then modify `release-test.yml`:

- Replace `push: true` with `push: false` in Docker build steps
- Comment out `docker manifest push` commands
- Add echo statements to show what would be pushed

### 2. Use Local Registry

Run a local Docker registry for testing:

```bash
# Start local registry
docker run -d -p 5000:5000 --name registry registry:2

# Set environment variable for act
export REGISTRY=localhost:5000
```

### 3. Mock GitHub Token

Create a `.secrets` file for act:

```bash
# .secrets (add to .gitignore!)
GITHUB_TOKEN=fake-token-for-testing
```

### 4. Test with Act

```bash
# Test release workflow with dry-run
act workflow_dispatch \
  -W .github/workflows/release-test.yml \
  -s GITHUB_TOKEN=fake-token \
  -e event.json \
  --container-architecture linux/amd64 \
  --dryrun

# Test without pushing (using modified workflow)
act workflow_dispatch \
  -W .github/workflows/release-test.yml \
  -s GITHUB_TOKEN=fake-token \
  -e event.json
```

Create `event.json` for workflow_dispatch:

```json
{
  "action": "workflow_dispatch",
  "inputs": {
    "version": "1.0.0-test",
    "release_type": "patch",
    "prerelease": true
  }
}
```

## Platform-Specific Considerations

### 1. Cross-Platform Builds

Act runs in Docker containers, so cross-platform builds might fail:

```bash
# Use platform flag
act -W .github/workflows/build-workflow.yml --platform ubuntu-latest=node:16-buster

# Or use specific runner images
act -W .github/workflows/build-workflow.yml --platform ubuntu-latest=catthehacker/ubuntu:act-latest
```

### 2. QEMU for Multi-Arch

For multi-arch Docker builds, ensure QEMU is set up:

```bash
# Install QEMU
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

### 3. Artifact Handling

Act handles artifacts differently than GitHub:

```bash
# Artifacts are stored in /tmp/artifacts by default
act -W .github/workflows/build-workflow.yml --artifact-server-path ./test-artifacts
```

## Safe Testing Checklist

- [ ] Never use real tokens when testing registry pushes
- [ ] Always use `push: false` for Docker builds in test workflows
- [ ] Use a local registry or dummy registry URL
- [ ] Test with `--dryrun` flag first
- [ ] Create separate test workflows (don't modify production ones)
- [ ] Add test workflows to `.gitignore`
- [ ] Use small test images to speed up testing

## Example Test Scripts

### test-build.sh

```bash
#!/bin/bash
# Test build workflow safely
act -W .github/workflows/build-workflow.yml \
  --platform ubuntu-latest=catthehacker/ubuntu:act-latest \
  --artifact-server-path ./test-artifacts
```

### test-docker-build.sh

```bash
#!/bin/bash
# Test Docker build without pushing

# Start local registry
docker run -d -p 5000:5000 --name test-registry registry:2

# Run modified workflow with local registry
REGISTRY=localhost:5000 act workflow_dispatch \
  -W .github/workflows/release-test.yml \
  -e event-test.json \
  -s GITHUB_TOKEN=test-token

# Cleanup
docker stop test-registry
docker rm test-registry
```

## Debugging Tips

1. **Verbose Output**

   ```bash
   act -v -W .github/workflows/build-workflow.yml
   ```

2. **Shell Access**

   ```bash
   act -W .github/workflows/build-workflow.yml --container-options "-it"
   ```

3. **Skip Specific Steps**
   Add `if: ${{ !env.ACT }}` to steps you want to skip in act

4. **Check Environment**

   ```yaml
   - name: Debug Environment
     run: |
       echo "Running in act: ${{ env.ACT }}"
       echo "Registry: ${{ env.REGISTRY }}"
   ```

## Known Limitations

1. **Service Containers**: Act doesn't fully support service containers
2. **Caching**: GitHub Actions cache doesn't work in act
3. **Secrets**: Limited secret handling compared to GitHub
4. **Runner Images**: Not all GitHub runner features are available
5. **ARM64 on x64**: Cross-platform builds may be slow or fail

## Alternative: Fork Testing

For critical workflows, consider:

1. Fork the repository
2. Modify the workflows to use your fork's registry
3. Test with real GitHub Actions on the fork
4. Use a test registry namespace (e.g., `ghcr.io/username/test-mcp-docsrs`)

This provides the most accurate testing environment while keeping production safe.
