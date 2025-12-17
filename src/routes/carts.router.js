import { Router } from "express";
import {
  getCart,
  clearUserCart,
  addProductToCart,
  updateProductQuantity,
  removeProductFromCart,
  purchaseCart
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getCart);
router.delete("/", clearUserCart);

router.post("/products/:productId", addProductToCart);
router.put("/products/:productId", updateProductQuantity);
router.delete("/products/:productId", removeProductFromCart);

router.post("/purchase", purchaseCart);

export default router;
