# Project general coding guidelines

## Code Style
- Use semantic HTML5 elements (header, main, section, article, etc.)
- Prefer modern JavaScript (ES6+) features like const/let, arrow functions, and template literals

## Naming Conventions
- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with underscore (_)
- Use ALL_CAPS for constants

## Code Quality
- Use meaningful variable and function names that clearly describe their purpose
- Include helpful comments for complex logic
- Add error handling for user inputs and API calls

## TSDoc Comment Guidelines

Use TSDoc to generate high-quality API documentation for TypeScript code. Follow the conventions below so tools like API Extractor and doc generators can consume comments consistently. See: https://tsdoc.org/

### When to write TSDoc
- **Public API surface**: exported functions, classes, interfaces, types, enums, constants.
- **React components**: component, props interface, and any public hooks.
- **Reusable utilities** used across packages or projects.
- **Complex logic** that isn’t obvious from the code.

### General rules
- Start each block with `/**` and end with `*/`.
- First sentence is a **summary** (one line, ends with a period).
- Follow with details in free text and/or structured **tags**.
- Keep language user-focused and concise; avoid restating the obvious.
- Prefer present tense and active voice.

### Common TSDoc tags
- `@param name - description` — one per parameter (note the hyphen).
- `@returns description` — what the function returns; omit for `void`.
- `@remarks` — extra context or caveats that don’t fit the summary.
- `@example` — runnable or near-runnable code fenced with ```ts.
- `@throws` — list known error conditions.
- `@defaultValue` — for defaulted props/params/fields.
- `@deprecated message` — mark deprecated APIs with guidance.
- `@see` — references to related APIs or docs.
- `@public` / `@beta` / `@alpha` / `@internal` — API release status (use deliberately; `@internal` items are excluded from public docs).

### Formatting tips
- Use backticks for identifiers: `MyType`, `myFunction()`.
- Link types/exports with `{@link Identifier}` or `{@link Module.Identifier}`.
- Use bullet lists for enumerations and step lists for procedures.
- Keep `@example` minimal; prefer one focused example per block.

### Function example

```ts
/**
 * Formats a number as a localized currency string.
 *
 * @param amount - The numeric amount to format.
 * @param currency - ISO 4217 currency code (e.g., `EUR`, `USD`).
 * @param locale - Optional BCP 47 locale; defaults to the user's locale.
 * @returns A currency-formatted string (e.g., `€1,234.56`).
 *
 * @remarks
 * Uses `Intl.NumberFormat` under the hood. For large batch formatting,
 * reuse a memoized formatter for performance.
 *
 * @example
 * ```ts
 * const price = formatCurrency(1234.56, 'EUR', 'hu-HU');
 * // "1 234,56 €"
 * ```
 *
 * @throws RangeError - If the currency code is invalid.
 * @public
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string { /* ... */ }
