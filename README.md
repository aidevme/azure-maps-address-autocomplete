# Azure Maps Address AutoComplete

A Power Apps Component Framework (PCF) control that provides intelligent address autocomplete functionality using the Azure Maps Search API.

## Features

- 🔍 **Real-time address suggestions** - Powered by Azure Maps Search API
- 🌍 **Multi-language support** - English, German, French, Italian, Portuguese, Spanish
- ⚡ **Modern tech stack** - Built with React 16 and Fluent UI 9
- 🎨 **Native theming** - Seamlessly integrates with Power Apps themes
- 📍 **Structured address data** - Returns street, city, state, postal code, country, and coordinates

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- Azure Maps account with a subscription key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/azure-maps-address-autocomplete.git
   cd azure-maps-address-autocomplete
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the control:
   ```bash
   npm run build
   ```

## Development

Start the test harness for local development:
```bash
npm start
```

Start with watch mode for live reload:
```bash
npm run start:watch
```

## Deployment

### Option 1: Push directly to environment
```bash
pac pcf push --publisher-prefix yourprefix
```

### Option 2: Create a solution package
1. Create a solution project:
   ```bash
   pac solution init --publisher-name YourPublisher --publisher-prefix yourprefix
   pac solution add-reference --path ../azure-maps-address-autocomplete
   ```

2. Build the solution:
   ```bash
   msbuild /t:restore
   msbuild
   ```

3. Import the solution `.zip` file into your Power Platform environment.

## Configuration

After adding the control to your form, configure the following:

| Property | Description |
|----------|-------------|
| `azureMapsAddressSearchAutoComplete` | Bound text field for the address value |

## Address Details

When a user selects an address from the dropdown, the `onSelect` callback provides the full `AzureMapsSearchResult` object containing structured address data.

### Using the `onSelect` Callback

```tsx
<AzureMapsAddressAutoComplete
  subscriptionKey="your-azure-maps-key"
  countrySet="CH"
  language="en-US"
  onSelect={(address, result) => {
    if (result) {
      // Extract individual address components
      const streetNumber = result.address.streetNumber ?? '';
      const streetName = result.address.streetName ?? '';
      const fullStreet = `${streetNumber} ${streetName}`.trim();
      
      const city = result.address.municipality ?? result.address.localName ?? '';
      const postalCode = result.address.postalCode ?? '';
      const country = result.address.country ?? '';
      const countryCode = result.address.countryCode ?? '';
      const state = result.address.countrySubdivision ?? '';
      
      // Coordinates for map integration
      const latitude = result.position?.lat;
      const longitude = result.position?.lon;
      
      // Update your form fields
      setStreet(fullStreet);
      setCity(city);
      setPostalCode(postalCode);
      setCountry(country);
      setCoordinates({ lat: latitude, lon: longitude });
    }
  }}
/>
```

### Available Address Properties

The `result.address` object contains the following properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `freeformAddress` | `string` | Full formatted address | `"Bahnhofstrasse 1, 8001 Zürich"` |
| `streetNumber` | `string?` | House/building number | `"1"` |
| `streetName` | `string?` | Street name | `"Bahnhofstrasse"` |
| `municipality` | `string?` | City/town name | `"Zürich"` |
| `municipalitySubdivision` | `string?` | District or borough | `"Altstadt"` |
| `neighbourhood` | `string?` | Neighborhood name | `"City Center"` |
| `postalCode` | `string?` | Postal/ZIP code | `"8001"` |
| `extendedPostalCode` | `string?` | Extended postal code | `"8001-1234"` |
| `country` | `string?` | Full country name | `"Switzerland"` |
| `countryCode` | `string?` | ISO 3166-1 alpha-2 code | `"CH"` |
| `countrySubdivision` | `string?` | State/province/canton code | `"ZH"` |
| `countrySubdivisionName` | `string?` | State/province/canton name | `"Zürich"` |
| `countrySubdivisionCode` | `string?` | Subdivision code | `"CH-ZH"` |
| `localName` | `string?` | Local area name | `"Zürich"` |

### Position (Coordinates)

The `result.position` object provides geographic coordinates:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `lat` | `number` | Latitude | `47.3769` |
| `lon` | `number` | Longitude | `8.5417` |

### Additional Result Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique result identifier |
| `type` | `string` | Result type (e.g., `"Street"`, `"Point Address"`) |
| `entityType` | `string?` | Entity type (e.g., `"Municipality"`, `"PostalCodeArea"`) |

## Project Structure

```
azure-maps-address-autocomplete/
├── AzureMapsAddressAutoComplete/
│   ├── components/          # React components
│   ├── services/            # Business logic services
│   ├── strings/             # Localization resources
│   ├── utils/               # Utility functions
│   ├── index.ts             # PCF control entry point
│   └── ControlManifest.Input.xml
├── package.json
└── tsconfig.json
```

## Supported Languages

| LCID | Language |
|------|----------|
| 1033 | English (US) |
| 1031 | German |
| 1036 | French |
| 1040 | Italian |
| 2070 | Portuguese |
| 3082 | Spanish |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the control |
| `npm run start` | Start the test harness |
| `npm run start:watch` | Start with watch mode |
| `npm run clean` | Clean build outputs |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
