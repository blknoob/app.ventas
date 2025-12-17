import CartsRepository from "../repositories/carts.repository.js";
import OrdersRepository from "../repositories/orders.repository.js";
import PaymentIntentRepository from "../repositories/paymentIntent.repository.js";

class OrdersService {
  constructor() {
    this.cartsRepo = new CartsRepository();
    this.ordersRepo = new OrdersRepository();
    this.paymentIntents = new PaymentIntentRepository();
  }

  async getCartSummary(userId) {
    const cart = await this.cartsRepo.findByUser(userId); // ya existe en tu proyecto
    if (!cart) return { items: [], total: 0 };

    const items = cart.products.map(p => ({
      productId: p.product._id,
      title: p.product.title || p.product.name,
      price: p.product.price,
      quantity: p.quantity,
      subtotal: p.product.price * p.quantity,
    }));
    const total = items.reduce((a, b) => a + b.subtotal, 0);
    return { cartId: cart._id, items, total };
  }

  async createFromCart(userId) {
    const summary = await this.getCartSummary(userId);
    if (summary.items.length === 0) throw new Error("Carrito vacío");
    return this.ordersRepo.create({
      user: userId,
      items: summary.items,
      total: summary.total,
      status: "pending_payment",
    });
  }

  async getById(orderId) {
    return this.ordersRepo.getById(orderId);
  }

  async ensurePaymentIntent({ orderId, amount, currency, method }) {
    const existing = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (existing) return existing;
    return this.paymentIntents.create({ orderId, amount, currency, method, status: "pending_payment" });
  }
}

export default OrdersService;
