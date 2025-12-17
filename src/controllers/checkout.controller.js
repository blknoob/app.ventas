import OrdersService from "../services/orders.service.js";
import mongoose from "mongoose";

const ordersService = new OrdersService();

export const showCheckout = async (req, res, next) => {
  try {
    // Aquí puedes obtener el carrito del usuario y mostrar el resumen
    // Por simplicidad, asume que tienes el carrito en req.cart
    res.render("checkout/checkout", { cart: req.cart });
  } catch (e) { next(e); }
};

export const confirmOrder = async (req, res, next) => {
  try {
    // Crea la orden a partir del carrito del usuario
    const userId = req.user._id;
    const cart = req.cart; // O recupéralo desde tu servicio
    const order = await ordersService.createFromCart(userId, cart);
    res.redirect(`/checkout/payment/${order._id}`);
  } catch (e) { next(e); }
};

export const showPayment = async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).send("El ID de la orden no es válido.");
  }
  try {
    const order = await ordersService.getById(orderId);
    if (!order) return res.status(404).send("Orden no encontrada.");
    // Opcional: valida que la orden pertenezca al usuario
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("No tienes acceso a esta orden.");
    }
    res.render("checkout/payment", { order });
  } catch (e) { next(e); }
};

export const showThanks = async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).send("El ID de la orden no es válido.");
  }
  try {
    const order = await ordersService.getById(orderId);
    if (!order) return res.status(404).send("Orden no encontrada.");
    // Opcional: valida que la orden pertenezca al usuario
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("No tienes acceso a esta orden.");
    }
    res.render("checkout/thanks", { order });
  } catch (e) { next(e); }
};
