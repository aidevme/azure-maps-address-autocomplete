# Contributing to Azure Maps Address AutoComplete

Thank you for your interest in contributing to this project! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (Node.js version, browser, Power Platform environment)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please open an issue with:

- A clear description of the feature
- The problem it solves or use case
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Make your changes** and ensure:
   - Code follows the existing style
   - ESLint passes: `npm run lint`
   - The control builds successfully: `npm run build`

4. **Test your changes** in the PCF test harness:
   ```bash
   npm start
   ```

5. **Commit your changes** with a clear message:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

6. **Push to your fork** and submit a Pull Request

## Code Style Guidelines

- Use **TypeScript** for all source files
- Follow **PascalCase** for component names, interfaces, and type aliases
- Follow **camelCase** for variables, functions, and methods
- Use **meaningful names** that describe the purpose
- Add **TSDoc comments** for public APIs
- Use **ES6+** features (const/let, arrow functions, template literals)

### Example

```typescript
/**
 * Formats an address into a single line string.
 *
 * @param street - The street address
 * @param city - The city name
 * @param country - The country name
 * @returns A formatted address string
 */
export function formatAddress(street: string, city: string, country: string): string {
  return `${street}, ${city}, ${country}`;
}
```

## Project Structure

```
AzureMapsAddressAutoComplete/
├── components/     # React UI components
├── services/       # Business logic and API services
├── strings/        # Localization (.resx files)
├── utils/          # Utility functions
├── index.ts        # PCF control entry point
└── ControlManifest.Input.xml
```

## Localization

When adding or modifying user-facing strings:

1. Add the key to all `.resx` files in the `strings/` folder
2. Provide translations for supported languages:
   - English (1033)
   - German (1031)
   - French (1036)
   - Italian (1040)
   - Portuguese (2070)
   - Spanish (3082)

## Questions?

Feel free to open an issue if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
