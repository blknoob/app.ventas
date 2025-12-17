import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title:   { type: String, required: true },   // snapshot del nombre
  price:   { type: Number, required: true },   // snapshot del precio
  quantity:{ type: Number, required: true, min: 1 },
  subtotal:{ type: Number, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items:  { type: [OrderItemSchema], default: [] },
  total:  { type: Number, required: true },
  status: { type: String, enum: ["pending_payment","paid","canceled"], default: "pending_payment" },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
