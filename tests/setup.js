// Setup global para tests

// Configuración global de Jest
beforeAll(() => {
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.COOKIE_SECRET = 'test_cookie_secret';
  process.env.SESSION_SECRET = 'test_session_secret';
});

beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  jest.clearAllMocks();
});

afterEach(() => {
  // Limpiar después de cada test si es necesario
  jest.restoreAllMocks();
});

// Helpers globales para tests
global.testHelpers = {
  // Helper para crear usuario de prueba
  createTestUser: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    age: 25,
    ...overrides
  }),

  // Helper para crear producto de prueba
  createTestProduct: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
    title: 'Producto de Prueba',
    description: 'Descripción del producto',
    price: 100,
    category: 'test',
    code: 'TEST001',
    stock: 10,
    image: '/images/test.jpg',
    ...overrides
  }),

  // Helper para crear carrito de prueba
  createTestCart: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439013',
    user: '507f1f77bcf86cd799439011',
    products: [],
    ...overrides
  })
};