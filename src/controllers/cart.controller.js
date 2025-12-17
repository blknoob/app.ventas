import CartsService from "../services/carts.service.js";

const cartsService = new CartsService();

// === FUNCIONES PARA VISTAS (HTML) ===

export const processCheckout = async (req, res) => {
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    if (!cart.products || cart.products.length === 0) {
      return res.status(400).send("No puedes finalizar la compra con el carrito vacío.");
    }
    const order = await cartsService.processCartPurchase(cart._id, req.user);
    res.redirect(`/checkout/payment/${order.ticket._id}`);
  } catch (error) {
    console.error("[ERROR /cart/checkout]", error);
    res.status(500).send(error.message || "Error al finalizar la compra");
  }
};

export const addToCart = async (req, res) => {
  const productId = req.body.productId;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.addProductToCart(cart._id, productId, 1);
    res.redirect("/");
  } catch (error) {
    console.error("[ERROR /cart/add]", error);
    res.status(500).send("Error agregando producto al carrito");
  }
};

export const removeFromCart = async (req, res) => {
  const productId = req.body.productId;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.removeProductToCart(cart._id, productId);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/remove]", error);
    res.status(500).send("Error quitando producto del carrito");
  }
};

export const updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.updateProductQuantity(cart._id, productId, quantity);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/update]", error);
    res.status(500).send("Error actualizando cantidad del producto");
  }
};

export const clearCart = async (req, res) => {
  const userId = req.user._id;
  try {
    const cart = await cartsService.getUserCart(userId);
    await cartsService.clearCart(cart._id);
    res.redirect("/cart");
  } catch (error) {
    console.error("[ERROR /cart/clear]", error);
    res.status(500).send("Error vaciando el carrito");
  }
};

// === FUNCIONES PARA APIs (JSON) ===

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    res.json({ status: "success", cart });
  } catch (error) {
    console.error("[ERROR getCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const addProductToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.addProductToCart(cart._id, productId, quantity);

    res.json({ status: "success", message: "Producto agregado al carrito", cart: result });
  } catch (error) {
    console.error("[ERROR addProductToCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateProductQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.updateProductQuantity(cart._id, productId, quantity);

    res.json({ status: "success", message: "Cantidad actualizada", cart: result });
  } catch (error) {
    console.error("[ERROR updateProductQuantity]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const removeProductFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.removeProductToCart(cart._id, productId);

    res.json({ status: "success", message: "Producto removido del carrito", cart: result });
  } catch (error) {
    console.error("[ERROR removeProductFromCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const clearUserCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.clearCart(cart._id);

    res.json({ status: "success", message: "Carrito vaciado", cart: result });
  } catch (error) {
    console.error("[ERROR clearUserCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const purchaseCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);
    const result = await cartsService.processCartPurchase(cart._id, req.user);

    res.json({ status: "success", message: "Compra procesada exitosamente", result });
  } catch (error) {
    console.error("[ERROR purchaseCart]", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === FUNCIÓN PARA VISTA DEL CARRITO ===

export const getCartView = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartsService.getUserCart(userId);

    // Convertir a objeto plano para Handlebars
    let plainCart = cart && cart.toObject ? cart.toObject() : cart;
    if (plainCart && Array.isArray(plainCart.products)) {
      plainCart.products = plainCart.products.map((item) => {
        const prod = item.product && item.product.toObject
          ? item.product.toObject()
          : item.product;
        return { ...item, product: prod };
      });
    }

    res.render("users/cart", { cart: plainCart });
  } catch (error) {
    console.error("[ERROR getCartView]", error);
    res.status(500).send("Error mostrando el carrito");
  }
};