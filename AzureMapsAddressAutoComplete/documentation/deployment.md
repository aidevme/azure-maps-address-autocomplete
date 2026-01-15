# GitHub Release Guide

This guide provides step-by-step instructions for creating a release of the Azure Maps Address AutoComplete PCF Control.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Automated Release (Recommended)](#option-1-automated-release-recommended)
- [Option 2: Manual GitHub Release](#option-2-manual-github-release)
- [Version Numbering Convention](#version-numbering-convention)
- [Release Checklist](#release-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before creating a release, ensure you have:

- [ ] Git installed and configured
- [ ] Repository cloned locally
- [ ] Push access to the repository
- [ ] All changes committed and pushed to `main` branch
- [ ] All tests passing (`npm run lint` and `npm run build`)

---

## Option 1: Automated Release (Recommended)

The repository includes a GitHub Actions workflow that automatically builds and creates releases when you push a version tag.

### Step 1: Ensure Your Code is Ready

```powershell
# Navigate to project directory
cd C:\aidevme\azure-maps-address-autocomplete

# Pull latest changes
git pull origin main

# Run linting to check for errors
npm run lint

# Build the project to verify it compiles
npm run build
```

### Step 2: Commit All Changes

```powershell
# Check status
git status

# Stage all changes
git add .

# Commit with a meaningful message
git commit -m "feat: description of changes"

# Push to main branch
git push origin main
```

### Step 3: Create a Version Tag

```powershell
# Create an annotated tag (replace X.Y.Z with your version)
git tag -a vX.Y.Z -m "Release vX.Y.Z - Brief description"

# Examples:
git tag -a v1.0.0 -m "Release v1.0.0 - Initial stable release"
git tag -a v1.1.0 -m "Release v1.1.0 - Added new country support"
git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes"
```

### Step 4: Push the Tag to GitHub

```powershell
# Push the specific tag
git push origin vX.Y.Z

# Example:
git push origin v1.0.0
```

### Step 5: Monitor the Workflow

1. Go to your repository on GitHub: `https://github.com/aidevme/azure-maps-address-autocomplete`
2. Click on the **Actions** tab
3. You should see the "Build and Release" workflow running
4. Wait for both jobs to complete:
   - ✅ **Build PCF Control** - Compiles and creates solution artifacts
   - ✅ **Create GitHub Release** - Creates the release with downloadable files

### Step 6: Verify the Release

1. Go to **Releases** in your repository (right sidebar or Code tab)
2. You should see your new release with:
   - Release title: `Azure Maps Address Autocomplete vX.Y.Z`
   - Release notes (auto-generated + custom)
   - Two attached assets:
     - `AzureMapsAddressSolution_managed.zip` - For production
     - `AzureMapsAddressSolution_unmanaged.zip` - For development

---

## Option 2: Manual GitHub Release

If you prefer to create releases manually through the GitHub web interface:

### Step 1: Build the Solutions Locally

```powershell
# Build the PCF control
npm run build

# Navigate to solution folder
cd Solution/AzureMapsAddressSolution

# Build managed solution
dotnet build --configuration Release /p:SolutionPackageType=Managed

# Build unmanaged solution
dotnet build --configuration Debug /p:SolutionPackageType=Unmanaged
```

### Step 2: Locate the Built Files

- **Managed Solution**: `Solution/AzureMapsAddressSolution/bin/Release/AzureMapsAddressSolution.zip`
- **Unmanaged Solution**: `Solution/AzureMapsAddressSolution/bin/Debug/AzureMapsAddressSolution.zip`

### Step 3: Create Release on GitHub

1. Go to your repository on GitHub
2. Click **Releases** in the right sidebar (or navigate to Code → Releases)
3. Click **Draft a new release**

### Step 4: Fill in Release Details

1. **Choose a tag**: 
   - Click "Choose a tag"
   - Type your version (e.g., `v1.0.0`)
   - Click "Create new tag: vX.Y.Z on publish"

2. **Target**: Select `main` branch

3. **Release title**: Enter a descriptive title
   ```
   Azure Maps Address Autocomplete v1.0.0
   ```

4. **Description**: Add release notes
   ```markdown
   ## What's Changed
   
   ### Azure Maps Address Autocomplete v1.0.0
   
   This release includes:
   - **Managed Solution** - For production environments
   - **Unmanaged Solution** - For development environments
   
   ### New Features
   - Feature 1 description
   - Feature 2 description
   
   ### Bug Fixes
   - Fix 1 description
   
   ### Installation
   1. Download the appropriate solution ZIP file
   2. Import into your Power Platform environment
   3. Configure the Azure Maps subscription key
   
   ### Requirements
   - Power Platform environment
   - Azure Maps subscription key
   ```

### Step 5: Attach Solution Files

1. Drag and drop or click to upload:
   - Rename `AzureMapsAddressSolution.zip` (from Release folder) to `AzureMapsAddressSolution_managed.zip`
   - Rename `AzureMapsAddressSolution.zip` (from Debug folder) to `AzureMapsAddressSolution_unmanaged.zip`
2. Upload both files to the release

### Step 6: Publish

1. Choose release type:
   - **Pre-release**: Check this for alpha/beta/RC versions
   - **Latest release**: Leave unchecked for stable releases (auto-set)
2. Click **Publish release**

---

## Version Numbering Convention

Follow [Semantic Versioning](https://semver.org/) (SemVer):

| Version | When to Use | Example |
|---------|-------------|---------|
| `vMAJOR.0.0` | Breaking changes, major features | `v2.0.0` |
| `vX.MINOR.0` | New features, backward compatible | `v1.1.0` |
| `vX.Y.PATCH` | Bug fixes, minor improvements | `v1.0.1` |
| `vX.Y.Z-alpha` | Alpha pre-release | `v1.1.0-alpha` |
| `vX.Y.Z-beta` | Beta pre-release | `v1.1.0-beta` |
| `vX.Y.Z-rc.1` | Release candidate | `v1.1.0-rc.1` |

### Version Examples

```powershell
# Initial release
git tag -a v1.0.0 -m "Release v1.0.0 - Initial stable release"

# Minor feature update
git tag -a v1.1.0 -m "Release v1.1.0 - Added multi-language support"

# Patch/bug fix
git tag -a v1.0.1 -m "Release v1.0.1 - Fixed address parsing issue"

# Pre-release versions
git tag -a v1.2.0-alpha -m "Release v1.2.0-alpha - Preview of new map features"
git tag -a v1.2.0-beta -m "Release v1.2.0-beta - Beta testing for new features"
git tag -a v1.2.0-rc.1 -m "Release v1.2.0-rc.1 - Release candidate 1"
```

---

## Release Checklist

Before creating a release, verify:

### Code Quality
- [ ] All code changes are committed
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] Manual testing completed

### Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Version numbers updated in `ControlManifest.Input.xml`

### Version Consistency
- [ ] Tag version matches manifest version
- [ ] Release notes document all significant changes

### Post-Release
- [ ] Verify release appears on GitHub
- [ ] Download and test the solution files
- [ ] Announce release to stakeholders (if needed)

---

## Troubleshooting

### Common Issues

#### Tag Already Exists

```powershell
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Recreate tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

#### Workflow Failed - Solution Folder Not Found

Ensure the `SOLUTION_FOLDER` in `.github/workflows/build-and-release.yml` points to the correct path:
```yaml
env:
  SOLUTION_FOLDER: Solution/AzureMapsAddressSolution
```

#### Duplicate Asset Upload Error

Both managed and unmanaged solutions have the same filename by default. The workflow automatically renames them:
- `AzureMapsAddressSolution_managed.zip`
- `AzureMapsAddressSolution_unmanaged.zip`

#### Release Job Skipped

The release job only runs on version tags. Ensure your tag starts with `v`:
```powershell
# Correct
git tag -a v1.0.0 -m "Release"

# Incorrect (won't trigger release)
git tag -a 1.0.0 -m "Release"
git tag -a release-1.0.0 -m "Release"
```

### View Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Expand the failed job to see detailed logs

---

## Quick Reference Commands

```powershell
# Check existing tags
git tag -l

# View tag details
git show v1.0.0

# Delete a tag (local + remote)
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Create and push a new release
git tag -a v1.0.0 -m "Release v1.0.0 - Description"
git push origin v1.0.0

# List recent commits (for release notes)
git log --oneline -10
```

---

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [README.md](../../README.md) - Project overview
- [GitHub Actions Workflow](../../.github/workflows/build-and-release.yml) - CI/CD configuration
