# Azure Maps Address AutoComplete Component

A Power Apps Component Framework (PCF) control that provides address autocomplete functionality using Azure Maps Search APIs.

## Features

- Address autocomplete with real-time suggestions
- Multiple search patterns for flexible querying
- Country filtering support
- Postal code lookup by city
- City lookup by postal code
- Fluent UI v9 styling

## Search Patterns

The component supports 5 different search patterns to accommodate various user needs:

### Pattern 1: Country Set via Prop

When the `countrySet` prop is configured, all searches are automatically filtered to the specified country/countries.

| Input | countrySet Prop | Result |
|-------|-----------------|--------|
| `New York` | `US` | Searches "New York" in United States |
| `Toronto` | `CA` | Searches "Toronto" in Canada |
| `Berlin` | `US,CA,DE` | Searches "Berlin" in US, Canada, and Germany |

### Pattern 2: Country Code Prefix (CC, query)

When no `countrySet` prop is provided, users can prefix their query with a 2-letter ISO country code followed by a comma.

| Input | Result |
|-------|--------|
| `CH, Zurich` | Searches "Zurich" in Switzerland |
| `DE, Berlin` | Searches "Berlin" in Germany |
| `US, 123 Main Street` | Searches "123 Main Street" in United States |
| `Zurich` | Searches "Zurich" globally (no country filter) |

### Pattern 3: City Postal Code Search (PLZ: or #)

Search for all postal codes within a city by prefixing with `PLZ:` or `#`.

| Input | Result |
|-------|--------|
| `PLZ: Zurich` | Returns all postal codes in Zurich |
| `PLZ: Berlin` | Returns all postal codes in Berlin |
| `#Vienna` | Returns all postal codes in Vienna |
| `#Basel` | Returns all postal codes in Basel |

> **Note:** This pattern uses the `countrySet` prop if provided, otherwise searches globally.

### Pattern 4: Postal Code to City (CC,postalcode)

Find the city/location for a specific postal code by using the format: country code + comma + numeric postal code.

| Input | Result |
|-------|--------|
| `CH,8001` | Returns Zurich (postal code 8001 in Switzerland) |
| `DE,10115` | Returns Berlin (postal code 10115 in Germany) |
| `AT,1010` | Returns Vienna (postal code 1010 in Austria) |
| `US,90210` | Returns Beverly Hills (postal code 90210 in USA) |

### Pattern 5: Country + City Postal Code Search (CC#city)

Search for postal codes in a specific city within a specific country using the format: country code + hash + city name.

| Input | Result |
|-------|--------|
| `CH#Zürich` | Returns all postal codes in Zürich, Switzerland |
| `DE#Berlin` | Returns all postal codes in Berlin, Germany |
| `AT#Wien` | Returns all postal codes in Vienna, Austria |
| `CH#Basel` | Returns all postal codes in Basel, Switzerland |

> **Tip:** This is the most precise pattern for postal code searches as it combines country and city filtering.

## Usage Examples

### Basic Address Search

```
1 Main Street, New York
```
Searches globally for the address.

### Country-Specific Address Search

```
US, 1 Main Street, New York
```
Searches only in the United States.

### Find All Postal Codes in a City

```
CH#Zürich
```
Returns: 8001, 8002, 8003, 8004, 8005, 8006, ... (all Zürich postal codes)

### Find City by Postal Code

```
CH,8001
```
Returns: Zürich, Switzerland

### Quick Postal Code Search (with countrySet prop)

```
#Berlin
```
Returns all postal codes in Berlin (filtered by countrySet prop if configured).

## Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | The current value of the address field |
| `placeholder` | `string` | Placeholder text for the input field |
| `disabled` | `boolean` | Whether the input is disabled |
| `subscriptionKey` | `string` | Azure Maps subscription key for API authentication |
| `language` | `string` | Language code for search results (e.g., 'en-US') |
| `countrySet` | `string` | Comma-separated country codes to limit results (e.g., 'US', 'US,CA,MX') |
| `onChange` | `function` | Callback when the address value changes |
| `onSelect` | `function` | Callback when an address is selected from suggestions |

## Country Codes

Use ISO 3166-1 alpha-2 country codes:

| Code | Country |
|------|---------|
| `US` | United States |
| `CA` | Canada |
| `GB` | United Kingdom |
| `DE` | Germany |
| `FR` | France |
| `CH` | Switzerland |
| `AT` | Austria |
| `IT` | Italy |
| `ES` | Spain |
| `NL` | Netherlands |

See [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) for the complete list.
