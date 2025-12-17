import PaymentsService from "../services/payments.service.js";
const paymentsService = new PaymentsService();

export const reportPagoMovil = async (req, res, next) => {
  try {
    const { bank, phone, docId, reference, amount } = req.body;
    const { orderId } = req.params;
    const proofUrl = req.file ? `/comprobantes/${req.file.filename}` : undefined;

    await paymentsService.captureManual({
      orderId,
      method: "pago_movil",
      payload: { bank, phone, docId, reference, amount, proofUrl }
    });

    res.redirect(`/checkout/thanks/${orderId}`);
  } catch (e) { next(e); }
};

export const reportZelle = async (req, res, next) => {
  try {
    const { email, reference, amount } = req.body;
    const { orderId } = req.params;

    await paymentsService.captureManual({
      orderId,
      method: "zelle",
      payload: { email, reference, amount }
    });

    res.redirect(`/checkout/thanks/${orderId}`);
  } catch (e) { next(e); }
};

// Webhook para pasarela de pago (opcional)
export const gatewayWebhook = async (req, res) => {
  const ok = await paymentsService.handleGatewayWebhook(req.body);
  res.status(ok ? 200 : 400).end();
};
