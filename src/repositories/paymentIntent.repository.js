import PaymentIntentDAO from "./daos/mongo/paymentIntent.dao.js";

export default class PaymentIntentRepository {
  constructor() { this.dao = new PaymentIntentDAO(); }

  getById(id) { return this.dao.findById(id); }
  getByOrderAndMethod(orderId, method) { return this.dao.findOne({ orderId, method }); }
  create(data) { return this.dao.create(data); }
  updateById(id, update) { return this.dao.updateById(id, update); }
  upsertByOrderAndMethod(orderId, method, data) {
    return this.dao.updateOne({ orderId, method }, { $set: data }, { upsert: true });
  }
}
