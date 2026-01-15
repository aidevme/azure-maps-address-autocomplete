import '@testing-library/jest-dom';

// Mock window.matchMedia for Fluent UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress noisy console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Suppress warnings from componentframework-mock library
    if (typeof args[0] === 'string' && args[0].includes('could not find row')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings and other expected errors
    if (typeof args[0] === 'string' && 
        (args[0].includes('Warning:') || args[0].includes('could not find row'))) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
