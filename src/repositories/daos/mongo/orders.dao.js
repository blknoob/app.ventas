import Order from "./models/order.model.js";

export default class OrdersDAO {
  create(data) {
    return Order.create(data); // Crea una orden
  }
  getById(id) {
    return Order.findById(id).lean(); // Busca por ID
  }
  markPaid(id) {
    return Order.findByIdAndUpdate(id, { status: "paid" }, { new: true }).lean();
  }
  updateStatus(id, status) {
    return Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }
}
