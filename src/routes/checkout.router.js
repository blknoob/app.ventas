import { Router } from "express";
import { authenticateToken as ensureAuth } from "../middlewares/auth.middleware.js";
import { showCheckout, confirmOrder, showPayment, showThanks } from "../controllers/checkout.controller.js";

const router = Router();

router.get("/checkout", ensureAuth, showCheckout);
router.post("/checkout/confirm", ensureAuth, confirmOrder);
router.get("/checkout/payment/:orderId", ensureAuth, showPayment);
router.get("/checkout/thanks/:orderId", ensureAuth, showThanks);

export default router;
