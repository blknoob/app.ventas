import Cart from "./models/carts.model.js";

class CartsDAO {
  async create(cartData) {
    try {
      const cart = new Cart(cartData);
      return await cart.save();
    } catch (error) {
      throw new Error(`Error al crear carrito: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Cart.findById(id);
    } catch (error) {
      throw new Error(`Error al buscar carrito: ${error.message}`);
    }
  }

  async findByUser(userId) {
    try {
      return await Cart.findOne({ user: userId }).populate("products.product");
    } catch (error) {
      throw new Error(`Error al buscar carrito por usuario: ${error.message}`);
    }
  }

  async update(id, cartData) {
    try {
      return await Cart.findByIdAndUpdate(id, cartData, { new: true });
    } catch (error) {
      throw new Error(`Error al actualizar carrito: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Cart.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar carrito: ${error.message}`);
    }
  }

  async addProduct(cartId, productId, quantity = 1) {
    try {
      const cart = await Cart.findById(cartId).populate("products.product");
      if (!cart) throw new Error("Carrito no encontrado");

      const existingProduct = cart.products.find((item) => {
        if (item.product && item.product._id) {
          return item.product._id.toString() === productId;
        }
        if (item.product) {
          return item.product.toString() === productId;
        }
        return false; // Evita error si item.product es null
      });

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      return await cart.save();
    } catch (error) {
      throw new Error(`Error al agregar producto: ${error.message}`);
    }
  }

  async removeProduct(cartId, productId) {
    try {
      const cart = await Cart.findById(cartId).populate("products.product");
      if (!cart) throw new Error("Carrito no encontrado");

      cart.products = cart.products.filter((item) => {
        if (item.product && item.product._id) {
          return item.product._id.toString() !== productId;
        }
        if (item.product) {
          return item.product.toString() !== productId;
        }
        return true; // Mantén el item si product es null
      });

      return await cart.save();
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  async findAll() {
    try {
      return await Cart.find({})
        .populate("user", "email first_name last_name")
        .populate("products.product");
    } catch (error) {
      throw new Error(`Error al obtener carritos: ${error.message}`);
    }
  }
}

export default CartsDAO;
