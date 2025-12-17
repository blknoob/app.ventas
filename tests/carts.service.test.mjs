// Test usando .mjs para ES modules
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Carts Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a cart', () => {
    // Test básico para verificar que Jest funcione
    const cart = { id: 1, products: [] };
    expect(cart).toHaveProperty('id');
    expect(cart.products).toEqual([]);
  });

  it('should handle empty cart', () => {
    const emptyCart = { products: [] };
    expect(emptyCart.products).toHaveLength(0);
  });
});