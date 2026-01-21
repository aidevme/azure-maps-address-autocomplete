# Azure Maps Address AutoComplete PCF Control

## Project Overview
This is a **Power Apps Component Framework (PCF)** control that provides Azure Maps-powered address autocomplete. Built with React 16, TypeScript, and Fluent UI v9, it deploys to Dynamics 365/Power Apps environments.

**Key Architecture:**
- **PCF Entry Point:** [index.ts](AzureMapsAddressAutoComplete/index.ts) implements `ComponentFramework.ReactControl<IInputs, IOutputs>` lifecycle (`init`, `updateView`, `destroy`, `getOutputs`)
- **React Bridge:** [AzureMapsAddressAutoCompleteApp.tsx](AzureMapsAddressAutoComplete/AzureMapsAddressAutoCompleteApp.tsx) connects PCF context to React component tree
- **Service Layer:** 5 core services ([services/index.ts](AzureMapsAddressAutoComplete/services/index.ts)) - `PcfContextService`, `UserSettingService`, `CountryService`, `MetadataService`, and Azure Maps API wrapper
- **Custom Hooks:** [useAddressSearch.ts](AzureMapsAddressAutoComplete/hooks/useAddressSearch.ts) manages search state/debouncing, [useAzureMap.ts](AzureMapsAddressAutoComplete/hooks/useAzureMap.ts) handles map rendering
- **Component Structure:** Feature-based organization with co-located styles (each major component has its own subdirectory)

## PCF-Specific Patterns

### 1. Lifecycle & Two-Way Data Binding
The control implements the standard PCF React control lifecycle:
- **`init()`** - Initialize services, set up context, parse configuration. Synchronous but can start async operations.
- **`updateView()`** - Called when inputs change; updates React component props and re-renders
- **`getOutputs()`** - PCF polls this to read output values stored in private fields (`this.street`, `this.city`, etc.)
- **`destroy()`** - Cleanup (currently minimal)

**Critical binding rules:**
- Store output values in class fields (e.g., `this.latitude = 47.3769`)
- Call `notifyOutputChanged()` after updating outputs to trigger PCF re-read
- **Use `null` (not `undefined`) to clear numeric Dataverse fields** (latitude, longitude, resultScore)
- String fields can use empty string `""` or `undefined` to clear

### 2. Multi-Type Country Field Support
The `country` property supports **three Dataverse field types** (defined via `<type-group>` in [ControlManifest.Input.xml](AzureMapsAddressAutoComplete/ControlManifest.Input.xml)):

1. **OptionSet:** Match country by ISO3 code via `ExternalValue` attribute
   - Requires fetching optionset metadata via `PcfContextService.getOrFetchOptionSetMetadata()`
   - Metadata cached in `MetadataService` to avoid redundant WebAPI calls
   - See [index.ts#L108-L118](AzureMapsAddressAutoComplete/index.ts#L108-L118)

2. **Lookup.Simple:** Query country entity table using `CountryService`
   - Searches by ISO2 or ISO3 codes using `findCountryLookupByISO2()` and `findCountryLookupByISO3()`
   - Returns `ComponentFramework.LookupValue` with entity reference

3. **SingleLine.Text:** Direct string assignment (country name)

Type resolution logic: [index.ts#L177-L243](AzureMapsAddressAutoComplete/index.ts#L177-L243)

### 3. Configuration via additionalParameters
The `additionalParameters` property accepts **JSON configuration** for advanced country mapping:
- **Schema:** [types/additionalParametersTypes.ts](AzureMapsAddressAutoComplete/types/additionalParametersTypes.ts)
- **Example:** [statics/additionalParameters.json](AzureMapsAddressAutoComplete/statics/additionalParameters.json)
- **Parser:** `parseAdditionalParameters()` validates and deserializes the JSON
- Used for custom country lookup table mappings when using Lookup.Simple type

## Search Patterns System

The control supports **5 distinct search patterns** (see [components/README.md](AzureMapsAddressAutoComplete/components/README.md)):

1. **Country Set via Prop** - `countrySet="CH"` filters all searches
2. **Country Code Prefix** - `CH, Zurich` searches Zurich in Switzerland
3. **City Postal Code Search** - `PLZ: Zurich` or `#Zurich` returns all postal codes
4. **Postal Code to City** - `CH,8001` finds city for postal code
5. **Country + City Postal** - `CH#Zürich` returns postal codes in Zürich, Switzerland

All parsing logic is in [utils/searchPatternUtils.ts](AzureMapsAddressAutoComplete/utils/searchPatternUtils.ts).

## Development Workflow

### Build & Test Commands
```powershell
npm start              # Start PCF test harness at http://localhost:8181
npm run start:watch    # Start with hot reload
npm run build          # Build for production
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report (min 50% threshold)
npm run lint           # Check code quality with ESLint
npm run lint:fix       # Auto-fix ESLint issues
npm run clean          # Clean build artifacts
npm run rebuild        # Clean + build
```

### Deployment Options
**Option 1: Direct push to environment**
```powershell
pac pcf push --publisher-prefix yourprefix
```

**Option 2: Package as solution** (see [README.md](README.md#deployment))
```powershell
pac solution init --publisher-name YourPublisher --publisher-prefix yourprefix
pac solution add-reference --path ../azure-maps-address-autocomplete
msbuild /t:restore
msbuild
# Import resulting .zip file into Power Platform environment
```

### Important Build Notes
- Control uses **React 16.14.0** (PCF constraint) - no modern hooks like `useId()`, `useTransition()`
- Fluent UI locked to **v9.46.2** (declared in manifest)
- Test harness runs on port 8181, not configurable
- ESLint uses flat config format (v9+) - see [eslint.config.mjs](eslint.config.mjs)

## Service Layer Architecture

Services follow dependency injection pattern, instantiated in [index.ts#init()](AzureMapsAddressAutoComplete/index.ts#L64-L118):

**Core Services:**
- **`PcfContextService`** - Central service managing PCF context, WebAPI calls, and metadata caching. Handles optionset metadata fetching and entity lookups.
- **`CountryService`** - Queries Dataverse country lookup tables via WebAPI using ISO2/ISO3 codes
- **`UserSettingService`** - Persists user preferences (map size, language) to browser localStorage
- **`MetadataService`** - Caches optionset metadata to reduce WebAPI calls
- **`AzureMapsService`** - Wrapper for Azure Maps Search API endpoints (not a class, just exported functions)

**Service Usage Pattern:**
1. Services instantiated in `init()` with required dependencies
2. Passed to React via props in `updateView()`
3. Consumed in hooks (`useAddressSearch`, `useAzureMap`) and components
4. Services access PCF context through `PcfContextService.context`

**Important:** Don't instantiate services in React components - always pass from PCF layer.

## Testing Patterns

- **Test Location:** All tests in `__tests__/` mirror source structure
- **Framework:** Jest 30 with ts-jest, React Testing Library 12 (compatible with React 16)
- **Mocking PCF:** Use `@shko.online/componentframework-mock` for PCF context
- **Coverage Target:** 50% minimum across branches, functions, lines, statements (see [jest.config.js](jest.config.js#L41-L47))
- **UUID Mock:** Required for deterministic tests (see [__mocks__/uuid.js](__mocks__/uuid.js))
- **Test Timeout:** 10 seconds (configurable in jest.config.js)

**Key Test Utilities:**
```typescript
import { MockContext, MockState } from '@shko.online/componentframework-mock';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**Example test structure:** [__tests__/components/AzureMapsAddressAutoCompleteApp.test.tsx](__tests__/components/AzureMapsAddressAutoCompleteApp.test.tsx)

**Running specific tests:**
```powershell
npm test -- useAddressSearch.test.ts    # Run single test file
npm run test:watch                      # Watch mode for TDD
```

## Code Style & Conventions

### Naming Conventions
- **PascalCase:** Components, interfaces, type aliases (`AzureMapsDropdown`, `IInputs`)
- **camelCase:** Variables, functions, methods (`handleChange`, `searchAddress`)
- **Underscore prefix:** Private class members (`_privateField`)
- **ALL_CAPS:** Constants (`DEBOUNCE_DELAY`, `MIN_CHARS_FOR_SUGGESTIONS`)

### File Organization
- **Components:** `components/ComponentName/` with index, subcomponents, styles
- **Utilities:** `utils/` for pure functions (formatters, parsers, validators)
- **Types:** `types/` for shared interfaces and type definitions
- **Constants:** `constants/` for magic values, messages, configuration
- **Hooks:** `hooks/` for stateful React logic
- **Services:** `services/ServiceName/` with interface and implementation

### Code Quality Standards
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<article>`)
- Prefer modern ES6+ features: `const`/`let`, arrow functions, template literals, destructuring
- Use meaningful variable/function names that clearly describe their purpose
- Add error handling for user inputs and API calls
- Avoid `any` type - use proper TypeScript types or `unknown`
- Prefer functional components with hooks (class components are legacy)

## TSDoc Documentation Guidelines

Document all public APIs, components, hooks, and utilities with TSDoc. See: https://tsdoc.org/

### When to write TSDoc
- **Public API surface:** exported functions, classes, interfaces, types, enums, constants
- **React components:** component function, props interface, and any public hooks
- **Reusable utilities:** functions used across packages or projects
- **Complex logic:** code that isn't obvious from reading alone

### Common TSDoc tags
- `@param name - description` — one per parameter (note the hyphen)
- `@returns description` — what the function returns; omit for `void`
- `@remarks` — extra context or caveats that don't fit the summary
- `@example` — runnable or near-runnable code fenced with \`\`\`ts
- `@throws` — list known error conditions
- `@defaultValue` — for defaulted props/params/fields
- `@deprecated message` — mark deprecated APIs with migration guidance
- `@see` — references to related APIs or docs
- `@public` / `@beta` / `@alpha` / `@internal` — API release status

### Formatting tips
- Use backticks for identifiers: \`MyType\`, \`myFunction()\`
- Link types/exports with \`{@link Identifier}\` or \`{@link Module.Identifier}\`
- Use bullet lists for enumerations and step lists for procedures
- Keep \`@example\` minimal; prefer one focused example per block
- First sentence is a **summary** (one line, ends with a period)
- Prefer present tense and active voice

**Example:**
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

## Common Gotchas

1. **React 16 Limitation:** PCF uses React 16.14 - no hooks like `useId()`, `useTransition()`, or concurrent features
2. **Fluent UI Version:** Must use `@fluentui/react-components` v9.46.2 (declared in manifest)
3. **No Direct DOM Access:** Never manipulate `container` directly; let React manage rendering
4. **Async in Lifecycle:** `init()` and `updateView()` are sync but can kick off async operations
5. **Language Codes:** PCF uses LCID integers (1033=en-US); convert using locale utils in [utils/localeUtils.ts](AzureMapsAddressAutoComplete/utils/localeUtils.ts)
6. **Clearing Numeric Fields:** Use `null` (not `undefined`) in `getOutputs()` to clear bound numeric Dataverse fields
7. **Service Instantiation:** Always instantiate services in PCF layer (`init()`), never in React components
8. **Test Harness Port:** Fixed to 8181, cannot be changed via configuration

## Key Files for Understanding Architecture

1. [index.ts](AzureMapsAddressAutoComplete/index.ts) - PCF control lifecycle implementation
2. [AzureMapsAddressAutoCompleteApp.tsx](AzureMapsAddressAutoComplete/AzureMapsAddressAutoCompleteApp.tsx) - React root + context provider
3. [hooks/useAddressSearch.ts](AzureMapsAddressAutoComplete/hooks/useAddressSearch.ts) - Search state management
4. [utils/searchPatternUtils.ts](AzureMapsAddressAutoComplete/utils/searchPatternUtils.ts) - Input parsing logic
5. [ControlManifest.Input.xml](AzureMapsAddressAutoComplete/ControlManifest.Input.xml) - PCF metadata defining properties
6. [services/PcfContext/PcfContextService.ts](AzureMapsAddressAutoComplete/services/PcfContext/PcfContextService.ts) - Context and WebAPI management
