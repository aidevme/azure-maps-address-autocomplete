import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * ESBuild configuration for PCF control.
 * Forces all React imports to resolve to the same instance.
 */
export default {
  alias: {
    'react': resolve(__dirname, 'node_modules/react'),
    'react-dom': resolve(__dirname, 'node_modules/react-dom'),
  },
};
