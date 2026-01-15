# Contributing to Azure Maps Address AutoComplete

First off, thank you for considering contributing to Azure Maps Address AutoComplete! It's people like you that make this tool better for the Power Platform community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions.

**Our Standards:**

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm
- Git
- [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- A code editor (VS Code recommended)
- Azure Maps account with a subscription key

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/azure-maps-address-autocomplete.git
   cd azure-maps-address-autocomplete
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/aidevme/azure-maps-address-autocomplete.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

The control runs in the PCF test harness at `http://localhost:8181`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the PCF test harness |
| `npm run start:watch` | Start with hot reload enabled |
| `npm run build` | Build the control for production |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run clean` | Clean build artifacts |
| `npm run rebuild` | Clean and rebuild the control |

## Project Structure

```
AzureMapsAddressAutoComplete/
├── components/              # React UI components
│   ├── AzureMapsAddressAutoComplete.tsx   # Main autocomplete component
│   ├── AzureMapsAddressDialog.tsx         # Address details dialog
│   ├── AzureMapsDropdown.tsx              # Suggestions dropdown
│   └── AzureMapsPanel/                    # Panel sub-components
│       ├── AddressFields.tsx
│       ├── CoordinatesSection.tsx
│       └── MapPreview.tsx
├── constants/               # Application constants
├── hooks/                   # Custom React hooks
│   ├── useAddressSearch.ts      # Address search logic
│   └── useAzureMap.ts           # Azure Maps integration
├── services/                # Business logic and APIs
│   ├── AzureMap/                # Azure Maps API service
│   ├── PcfContext/              # PCF context management
│   └── UserSetting/             # User settings service
├── statics/                 # Static JSON data files
├── strings/                 # Localization (.resx files)
├── styles/                  # Component styles
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── index.ts                 # PCF control entry point
├── AzureMapsAddressAutoCompleteApp.tsx    # Main app component
└── ControlManifest.Input.xml              # PCF manifest
```

## Making Changes

### Create a Branch

Always create a branch for your changes:

```bash
# Sync with upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-export-csv` |
| Bug fix | `fix/description` | `fix/dropdown-focus` |
| Docs | `docs/description` | `docs/update-readme` |
| Refactor | `refactor/description` | `refactor/hook-cleanup` |

### Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Export types from `types/index.ts`

```typescript
// Good
interface AddressSearchProps {
  subscriptionKey: string;
  countrySet?: string;
  onSelect: (address: string, result: AzureMapsSearchResult) => void;
}

// Avoid
const handleSelect = (data: any) => { /* ... */ };
```

### React Components

- Use functional components with hooks
- Use `React.memo` for performance-critical components
- Keep components focused and single-purpose
- Use Fluent UI 9 components for consistency

```tsx
// Component template
import { memo } from 'react';

interface Props {
  // ...
}

export const MyComponent = memo(function MyComponent({ ...props }: Props) {
  return (
    <div>
      {/* content */}
    </div>
  );
});
```

### Hooks

- Prefix custom hooks with `use`
- Keep hooks in `hooks/` directory
- Document complex hooks with TSDoc comments

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EntityCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAddressSearch.ts` |
| Utils | camelCase | `formatters.ts` |
| Types | camelCase | `azureMapsTypes.ts` |
| Constants | camelCase | `messages.ts` |

### TSDoc Comments

Use TSDoc for all public APIs:

```typescript
/**
 * Formats an address into a single line string.
 *
 * @param street - The street address
 * @param city - The city name
 * @param country - The country name
 * @returns A formatted address string
 *
 * @example
 * ```ts
 * const address = formatAddress('123 Main St', 'Zurich', 'Switzerland');
 * // "123 Main St, Zurich, Switzerland"
 * ```
 */
export function formatAddress(street: string, city: string, country: string): string {
  return `${street}, ${city}, ${country}`;
}
```

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(dropdown): add keyboard navigation support
fix(search): resolve debounce timing issue
docs(readme): update installation instructions
refactor(hooks): simplify useAddressSearch logic
```

## Pull Request Process

### Before Submitting

- [ ] **Test your changes** - Ensure the control works in the test harness
- [ ] **Lint passes** - Run `npm run lint`
- [ ] **Build succeeds** - Run `npm run build`
- [ ] **Update documentation** - If needed
- [ ] **Rebase on main** - Keep history clean

### Creating the PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request on GitHub
3. Fill in the PR template with:
   - Clear description of changes
   - Related issues (if any)
   - Screenshots (for UI changes)

### PR Title Format

Use the same format as commit messages:

```
feat(dropdown): add keyboard navigation support
```

### Review Process

- All PRs require at least one review
- Address feedback promptly
- Keep discussions constructive
- Squash commits if requested

## Reporting Bugs

### Before Reporting

- Check existing issues
- Try the latest version
- Reproduce in the PCF test harness

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Node.js: [e.g., 18.17.0]
- Power Platform environment: [e.g., Production]
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

## Localization

When adding or modifying user-facing strings:

1. Add the key to all `.resx` files in the `strings/` folder
2. Provide translations for supported languages:
   - English (1033)
   - German (1031)
   - French (1036)
   - Hungarian (1038)
   - Italian (1040)
   - Portuguese (2070)
   - Spanish (3082)

## Questions?

- Open a Discussion or Issue
- Check existing issues and discussions first

---

**Thank you for contributing!**

By contributing, you agree that your contributions will be licensed under the MIT License.
