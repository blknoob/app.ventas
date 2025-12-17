import PaymentIntentRepository from "../repositories/paymentIntent.repository.js";
import OrdersRepository from "../repositories/orders.repository.js";

class PaymentsService {
  constructor() {
    this.paymentIntents = new PaymentIntentRepository();
    this.ordersRepo = new OrdersRepository();
  }

  // Crea o actualiza un PaymentIntent para pagos manuales (Pago Móvil, Zelle, etc.)
  async captureManual({ orderId, method, payload }) {
    const amount = Number(payload.amount);
    const currency = method === "zelle" ? "USD" : "VES";

    // Busca o crea el intent
    let pi = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (!pi) {
      pi = await this.paymentIntents.create({
        orderId,
        amount,
        currency,
        method,
        status: "pending",
      });
    }

    // Actualiza con referencia y comprobante
    const update = {
      reference: payload.reference,
      customerProof: payload.proofUrl,
      status: "pending",
    };
    return this.paymentIntents.updateById(pi._id, update);
  }

  // Ejemplo para webhook de pasarela (opcional)
  async handleGatewayWebhook(body) {
    const orderId = body?.orderId;
    const approved = body?.status === "APPROVED";
    const method = "megasoft";

    const pi = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (!pi) return false;

    await this.paymentIntents.updateById(pi._id, {
      status: approved ? "paid" : "failed",
    });
    if (approved) await this.ordersRepo.markPaid(orderId);
    return true;
  }
}

export default PaymentsService;
