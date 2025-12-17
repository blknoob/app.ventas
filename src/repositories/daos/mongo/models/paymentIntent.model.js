import mongoose from "mongoose";

const PaymentIntentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ["VES", "USD"], default: "USD" },
  method: { type: String, enum: ["pago_movil", "zelle", "transfer"], required: true },
  status: { type: String, enum: ["pending", "verified", "paid", "failed"], default: "pending" },
  reference: { type: String },         // Referencia bancaria o de pago
  customerProof: { type: String },     // Ruta o URL del comprobante (imagen/pdf)
}, { timestamps: true });

export default mongoose.model("PaymentIntent", PaymentIntentSchema);
