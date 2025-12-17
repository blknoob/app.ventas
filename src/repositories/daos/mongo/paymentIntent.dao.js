import PaymentIntent from "./models/paymentIntent.model.js";

export default class PaymentIntentDAO {
  async findById(id)            { return PaymentIntent.findById(id).lean(); }
  async findOne(filter)         { return PaymentIntent.findOne(filter).lean(); }
  async create(data)            { return PaymentIntent.create(data); }
  async updateById(id, update)  { return PaymentIntent.findByIdAndUpdate(id, update, { new: true }).lean(); }
  async updateOne(filter, up)   { return PaymentIntent.findOneAndUpdate(filter, up, { new: true }).lean(); }
}
