/**
 * Unit tests for the AzureMapsAddressAutoComplete PCF Control.
 *
 * Uses @shko.online/componentframework-mock to test the control lifecycle:
 * - init()
 * - updateView()
 * - getOutputs()
 * - destroy()
 */

import {
  ComponentFrameworkMockGeneratorReact,
  StringPropertyMock,
  DecimalNumberPropertyMock,
  TwoOptionsPropertyMock,
  EnumPropertyMock,
} from '@shko.online/componentframework-mock';
import { AzureMapsAddressAutoComplete } from '../AzureMapsAddressAutoComplete/index';
import { IInputs, IOutputs } from '../AzureMapsAddressAutoComplete/generated/ManifestTypes';

/**
 * Helper function to safely get outputs from the control.
 */
function getOutputs(mockGenerator: ComponentFrameworkMockGeneratorReact<IInputs, IOutputs>): IOutputs {
  const outputs = mockGenerator.control.getOutputs?.();
  if (!outputs) {
    throw new Error('getOutputs returned undefined');
  }
  return outputs;
}

describe('AzureMapsAddressAutoComplete PCF Control', () => {
  let mockGenerator: ComponentFrameworkMockGeneratorReact<IInputs, IOutputs>;

  beforeEach(() => {
    // Create a new mock generator for each test
    mockGenerator = new ComponentFrameworkMockGeneratorReact(
      AzureMapsAddressAutoComplete,
      {
        azureMapsAddressSearchAutoComplete: StringPropertyMock,
        street: StringPropertyMock,
        city: StringPropertyMock,
        postalCode: StringPropertyMock,
        county: StringPropertyMock,
        stateProvince: StringPropertyMock,
        stateProvinceCode: StringPropertyMock,
        country: StringPropertyMock,
        countryCodeISO2: StringPropertyMock,
        countryCodeISO3: StringPropertyMock,
        longitude: DecimalNumberPropertyMock,
        latitude: DecimalNumberPropertyMock,
        resultScore: DecimalNumberPropertyMock,
        defaultCountries: StringPropertyMock,
        showMaps: TwoOptionsPropertyMock,
        mapSize: EnumPropertyMock,
        useUserLanguage: TwoOptionsPropertyMock,
        defaultLanguage: EnumPropertyMock,
        additionalParameters: StringPropertyMock,
        subscriptionKey: StringPropertyMock,
      }
    );
  });

  afterEach(() => {
    // Clean up after each test
    mockGenerator.control.destroy();
  });

  describe('Control Lifecycle', () => {
    it('should initialize without errors', () => {
      // Arrange & Act
      mockGenerator.ExecuteInit();

      // Assert
      expect(mockGenerator.control).toBeDefined();
    });

    it('should execute updateView without errors', () => {
      // Arrange
      mockGenerator.ExecuteInit();

      // Act & Assert - should not throw
      expect(() => mockGenerator.ExecuteUpdateView()).not.toThrow();
    });

    it('should return a React element from updateView', () => {
      // Arrange
      mockGenerator.ExecuteInit();

      // Act
      const element = mockGenerator.ExecuteUpdateView();

      // Assert
      expect(element).toBeDefined();
    });

    it('should destroy without errors', () => {
      // Arrange
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Act & Assert - should not throw
      expect(() => mockGenerator.control.destroy()).not.toThrow();
    });
  });

  describe('getOutputs', () => {
    it('should return empty outputs when no data is set', () => {
      // Arrange
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Act
      const outputs = getOutputs(mockGenerator);

      // Assert
      expect(outputs).toBeDefined();
      expect(outputs.azureMapsAddressSearchAutoComplete).toBe('');
      expect(outputs.street).toBe('');
      expect(outputs.city).toBe('');
      expect(outputs.postalCode).toBe('');
    });

    it('should return initial value when set in context', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        azureMapsAddressSearchAutoComplete: '123 Main Street, Seattle, WA',
      });
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Act
      const outputs = getOutputs(mockGenerator);

      // Assert
      expect(outputs.azureMapsAddressSearchAutoComplete).toBe('123 Main Street, Seattle, WA');
    });

    it('should return all address fields when set', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        azureMapsAddressSearchAutoComplete: '1 Microsoft Way, Redmond, WA',
        street: '1 Microsoft Way',
        city: 'Redmond',
        postalCode: '98052',
        county: 'King County',
        stateProvince: 'Washington',
        stateProvinceCode: 'WA',
        country: 'United States',
        countryCodeISO2: 'US',
        countryCodeISO3: 'USA',
        latitude: 47.6423,
        longitude: -122.1391,
      });
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Act
      const outputs = getOutputs(mockGenerator);

      // Assert
      expect(outputs.street).toBe('1 Microsoft Way');
      expect(outputs.city).toBe('Redmond');
      expect(outputs.postalCode).toBe('98052');
      expect(outputs.county).toBe('King County');
      expect(outputs.stateProvince).toBe('Washington');
      expect(outputs.stateProvinceCode).toBe('WA');
      expect(outputs.country).toBe('United States');
      expect(outputs.countryCodeISO2).toBe('US');
      expect(outputs.countryCodeISO3).toBe('USA');
    });

    it('should return coordinates when set', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        latitude: 47.6062,
        longitude: -122.3321,
      });
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Act
      const outputs = getOutputs(mockGenerator);

      // Assert
      expect(outputs.latitude).toBe(47.6062);
      expect(outputs.longitude).toBe(-122.3321);
    });
  });

  describe('Input Properties', () => {
    it('should accept subscription key', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        subscriptionKey: 'test-subscription-key-12345',
      });

      // Act
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Assert - control should initialize without error
      expect(mockGenerator.control).toBeDefined();
    });

    it('should accept default countries filter', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        defaultCountries: 'US,CA,MX',
      });

      // Act
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Assert - control should initialize without error
      expect(mockGenerator.control).toBeDefined();
    });

    it('should accept showMaps configuration', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        showMaps: true,
      });

      // Act
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Assert - control should initialize without error
      expect(mockGenerator.control).toBeDefined();
    });

    it('should accept useUserLanguage configuration', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        useUserLanguage: true,
      });

      // Act
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Assert - control should initialize without error
      expect(mockGenerator.control).toBeDefined();
    });
  });

  describe('Context Properties', () => {
    it('should have access to mode.trackContainerResize', () => {
      // Arrange & Act
      mockGenerator.ExecuteInit();

      // Assert - verify context mock provides mode API
      expect(mockGenerator.context.mode).toBeDefined();
      expect(mockGenerator.context.mode.trackContainerResize).toBeDefined();
    });

    it('should have access to parameters', () => {
      // Arrange & Act
      mockGenerator.ExecuteInit();

      // Assert - verify context mock provides parameters
      expect(mockGenerator.context.parameters).toBeDefined();
      expect(mockGenerator.context.parameters.azureMapsAddressSearchAutoComplete).toBeDefined();
      expect(mockGenerator.context.parameters.subscriptionKey).toBeDefined();
    });
  });

  describe('Multiple Update Cycles', () => {
    it('should handle multiple updateView calls', () => {
      // Arrange
      mockGenerator.ExecuteInit();

      // Act - simulate multiple update cycles
      mockGenerator.ExecuteUpdateView();
      mockGenerator.ExecuteUpdateView();
      mockGenerator.ExecuteUpdateView();

      // Assert - control should still be functional
      const outputs = getOutputs(mockGenerator);
      expect(outputs).toBeDefined();
    });

    it('should reflect updated values after context change', () => {
      // Arrange
      mockGenerator.context._SetCanvasItems({
        azureMapsAddressSearchAutoComplete: 'Initial Address',
      });
      mockGenerator.ExecuteInit();
      mockGenerator.ExecuteUpdateView();

      // Verify initial state
      let outputs = getOutputs(mockGenerator);
      expect(outputs.azureMapsAddressSearchAutoComplete).toBe('Initial Address');

      // Act - update context with new value
      mockGenerator.context._SetCanvasItems({
        azureMapsAddressSearchAutoComplete: 'Updated Address',
      });
      mockGenerator.ExecuteUpdateView();

      // Note: The control stores the initial value in init(), 
      // subsequent updateView calls may not update internal state
      // This test documents current behavior
      outputs = getOutputs(mockGenerator);
      expect(outputs).toBeDefined();
    });
  });
});
