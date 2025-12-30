import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    mainCategory: {
      type: String,
      required: true,
      enum: ['Alimentación', 'Limpieza', 'Higiene Personal', 'Bebidas', 'Hogar', 'Bebés y Niños'],
    },
    subCategory: {
      type: String,
      required: true,
    },
    // Mantener category para compatibilidad
    category: {
      type: String,
      required: false,
    },
    image: {
      type: String, 
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
