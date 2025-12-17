import { Router } from "express";
import usersRouter from "./users.router.js";
import productsRouter from "./products.router.js";
import cartsRouter from "./carts.router.js";
import ticketsRouter from "./tickets.router.js";
import adminRouter from "./admin.router.js";
import checkoutRouter from "./checkout.router.js";
import paymentsRouter from "./payments.router.js";
import viewsRouter from "./views.router.js";

const router = Router();

// OWASP - Health check endpoint para Docker
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

router.use("/api/users", usersRouter);
router.use("/api/products", productsRouter);
router.use("/api/carts", cartsRouter);
router.use("/api/tickets", ticketsRouter);
router.use("/api/checkout", checkoutRouter);
router.use("/api/payments", paymentsRouter);
router.use("/api/admin", adminRouter);

router.use("/", viewsRouter);

export default router;
