// Mock for uuid module
module.exports = {
  v4: jest.fn(() => 'test-uuid-12345678-1234-1234-1234-123456789abc'),
};
