// Mock database for tests
export const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

// Mock user for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com', 
  display_name: 'Test User',
  password_hash: '$2a$10$mockHashValue',
  status: 'active',
  authz_version: 1,
  roles: ['Viewer']
};

// Mock database responses
export const mockDbResponses = {
  // User queries
  getUserById: {
    rows: [mockUser],
    rowCount: 1
  },
  getUserByEmail: {
    rows: [mockUser],
    rowCount: 1
  },
  createUser: {
    rows: [{ id: mockUser.id }],
    rowCount: 1
  },
  updateUser: {
    rows: [mockUser],
    rowCount: 1
  },
  // Empty result
  noResults: {
    rows: [],
    rowCount: 0
  }
};