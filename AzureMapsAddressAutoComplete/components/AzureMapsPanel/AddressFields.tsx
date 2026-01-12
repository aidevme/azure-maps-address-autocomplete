/**
 * Address Fields Sub-component for AzureMapsPanel.
 *
 * @remarks
 * Displays address information fields in a read-only format.
 *
 * @packageDocumentation
 */

import * as React from 'react';
import { Field, Input } from '@fluentui/react-components';

/**
 * Address data structure for the AddressFields component.
 */
export interface IAddressData {
  /** Street name. */
  streetName?: string;
  /** Street number. */
  streetNumber?: string;
  /** City/municipality name. */
  municipality?: string;
  /** Postal/ZIP code. */
  postalCode?: string;
  /** County name. */
  countrySubdivisionName?: string;
  /** State/Province code. */
  countrySubdivision?: string;
  /** Country name. */
  country?: string;
}

/**
 * Props for the AddressFields component.
 */
export interface IAddressFieldsProps {
  /** Address data to display. */
  address: IAddressData;
  /** Size of the fields ('small' | 'medium'). */
  fieldSize: 'small' | 'medium';
  /** Function to get localized strings. */
  getString: (key: string, fallback: string) => string;
}

/**
 * A sub-component that displays address fields in a read-only format.
 *
 * @param props - The component props.
 * @returns The rendered React element.
 *
 * @example
 * ```tsx
 * <AddressFields
 *   address={result.address}
 *   fieldSize="medium"
 *   getString={(key, fallback) => pcfContext?.getString(key, fallback) ?? fallback}
 * />
 * ```
 *
 * @internal
 */
export const AddressFields: React.FC<IAddressFieldsProps> = (props) => {
  const { address, fieldSize, getString } = props;

  return (
    <>
      {(address.streetName ?? address.streetNumber) && (
        <Field
          label={getString('azure-maps-panel-street', 'Street')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={[address.streetName, address.streetNumber].filter(Boolean).join(' ')}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {address.municipality && (
        <Field
          label={getString('azure-maps-panel-city', 'City')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={address.municipality}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {address.postalCode && (
        <Field
          label={getString('azure-maps-panel-postalCode', 'Postal Code')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={address.postalCode}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {address.countrySubdivisionName && (
        <Field
          label={getString('azure-maps-panel-county', 'County')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={address.countrySubdivisionName}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {address.countrySubdivision && (
        <Field
          label={getString('azure-maps-panel-stateProvince', 'State/Province')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={address.countrySubdivision}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {address.country && (
        <Field
          label={getString('azure-maps-panel-country', 'Country')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={address.country}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
    </>
  );
};
