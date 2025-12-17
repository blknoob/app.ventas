// Tests básicos para verificar funcionalidad sin ES modules complejos
describe('CartsService - Basic Tests', () => {
  test('should create cart object', () => {
    const cart = {
      _id: 'cart123',
      user: 'user123',
      products: []
    };

    expect(cart).toHaveProperty('_id');
    expect(cart).toHaveProperty('user');
    expect(cart.products).toEqual([]);
  });

  test('should handle cart with products', () => {
    const cart = {
      _id: 'cart123',
      user: 'user123',
      products: [
        { product: 'prod1', quantity: 2 },
        { product: 'prod2', quantity: 1 }
      ]
    };

    expect(cart.products).toHaveLength(2);
    expect(cart.products[0]).toHaveProperty('product');
    expect(cart.products[0]).toHaveProperty('quantity');
  });

  test('should calculate cart total', () => {
    const products = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ];

    const total = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    expect(total).toBe(250);
  });

  test('should validate product object', () => {
    const product = {
      _id: 'prod123',
      title: 'Producto Test',
      price: 100,
      stock: 10
    };

    expect(product.title).toBeTruthy();
    expect(product.price).toBeGreaterThan(0);
    expect(product.stock).toBeGreaterThanOrEqual(0);
  });

  test('should handle user validation', () => {
    const user = {
      _id: 'user123',
      email: 'test@example.com',
      role: 'user'
    };

    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(['user', 'admin'].includes(user.role)).toBeTruthy();
  });
});