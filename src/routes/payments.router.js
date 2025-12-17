import { Router } from "express";
import { reportPagoMovil, reportZelle, gatewayWebhook } from "../controllers/payments.controller.js";
import { createPaymentProofUpload, validateFile, handleMulterError } from "../middlewares/upload.middleware.js";

// OWASP - Configuración segura de multer para comprobantes de pago
const upload = createPaymentProofUpload();

const router = Router();

// OWASP - Validación segura de comprobantes de pago
router.post(
  "/api/payments/pagomovil/:orderId", 
  upload.single("proof"), 
  validateFile({ 
    required: true, 
    maxFileSize: 5 * 1024 * 1024 // 5MB para comprobantes
  }),
  reportPagoMovil
);
router.post("/api/payments/zelle/:orderId", reportZelle);
router.post("/api/payments/webhook", gatewayWebhook);

// Middleware de manejo de errores de multer
router.use(handleMulterError);

export default router;
