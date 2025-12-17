// RUTAS VISTAS
import { Router } from "express";
import {
  authenticatePassport,
  requireAdmin,
  redirectPassport,
  userInSesion,
} from "../middlewares/passport.middleware.js";
import ProductsViewController from "../controllers/products.view.js";
import UsersViewController from "../controllers/users.view.js";
import {
  processCheckout,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartView
} from "../controllers/cart.controller.js";
import { validateCartData, validateObjectId } from "../middlewares/validation.middleware.js";
import PaymentsService from "../services/payments.service.js";
import { createPaymentProofUpload, createSecureStorage, validateFile, handleMulterError } from "../middlewares/upload.middleware.js";
import multer from "multer";
import mongoose from "mongoose";

const router = Router();
const productsViewController = new ProductsViewController();
const usersViewController = new UsersViewController();
const paymentsService = new PaymentsService();

// OWASP - Configuraciones seguras de multer
const paymentProofUpload = createPaymentProofUpload();

// Para imágenes de productos
const productImageStorage = createSecureStorage('public/images/');
const productImageUpload = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Finalizar compra y generar orden desde la vista
router.post(
  "/cart/checkout",
  authenticatePassport,
  userInSesion,
  processCheckout
);

// Quitar producto del carrito desde la vista
router.post(
  "/cart/remove",
  authenticatePassport,
  userInSesion,
  removeFromCart
);

// Rutas públicas
router.get("/login", redirectPassport, (req, res) => {
  res.render("auth/login");
});

router.get("/register", redirectPassport, (req, res) => {
  res.render("auth/register");
});

router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/");
});

router.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.render("auth/resetPassword", {
    token: token,
  });
});

// Página principal pública - Catálogo de productos
router.get(
  "/",
  userInSesion,
  productsViewController.getProductsView,
  (req, res) => {
    res.render("index", {
      products: req.products,
      user: res.locals.user || null,
      isPublic: true,
    });
  }
);

router.get(
  "/current",
  authenticatePassport,
  userInSesion,
  usersViewController.getCurrentView
);

router.get("/cart", authenticatePassport, userInSesion, getCartView);

router.post(
  "/cart/add",
  authenticatePassport,
  userInSesion,
  validateCartData,
  addToCart
);

// Actualizar cantidad de producto en carrito
router.post(
  "/cart/update",
  authenticatePassport,
  userInSesion,
  validateCartData,
  updateCartQuantity
);

// Vaciar carrito
router.post(
  "/cart/clear",
  authenticatePassport,
  userInSesion,
  clearCart
);

import TicketsService from "../services/tickets.service.js";
const ticketsService = new TicketsService();

router.get("/tickets", authenticatePassport, userInSesion, async (req, res) => {
  try {
    const userEmail = req.user.email;
    let tickets = await ticketsService.repository.findByUser(userEmail);
    // Convertir a objetos planos y poblar títulos de productos si es posible
    tickets = await Promise.all(
      tickets.map(async (t) => {
        let ticket = t.toObject ? t.toObject() : t;
        if (ticket.products && ticket.products.length) {
          ticket.products = await Promise.all(
            ticket.products.map(async (item) => {
              if (item.product && typeof item.product === "string") {
                // Buscar el producto por ID para obtener el título
                try {
                  const ProductsService = (
                    await import("../services/products.service.js")
                  ).default;
                  const productsService = new ProductsService();
                  const prod = await productsService.getById(item.product);
                  return {
                    ...item,
                    product: {
                      _id: item.product,
                      title: prod?.title || item.product,
                    },
                  };
                } catch {
                  return item;
                }
              }
              return item;
            })
          );
        }
        return ticket;
      })
    );
    res.render("users/tickets", { tickets });
  } catch (error) {
    console.error("[ERROR /tickets]", error);
    res.status(500).send("Error mostrando los tickets");
  }
});

// Vista para solicitar recuperación de contraseña
router.get("/forgot-password", (req, res) => {
  res.render("auth/forgotPassword");
});

// Vista para restablecer contraseña (ya existe, pero aseguro que esté bien)
router.get("/reset-password", (req, res) => {
  const { token } = req.query;
  res.render("auth/resetPassword", { token });
});

// Rutas admin
router.get(
  "/admin/panel",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  (req, res) => {
    res.render("admin/adminPanel");
  }
);

import ProductsService from "../services/products.service.js";
const productsService = new ProductsService();

router.get(
  "/admin/products",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const products = await productsService.getAll();
      const plainProducts = products.map((p) =>
        p.toObject ? p.toObject() : p
      );
      res.render("admin/updateProducts", { products: plainProducts });
    } catch (error) {
      res.status(500).send("Error mostrando productos");
    }
  }
);

router.get(
  "/admin/users",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const UsersService = (await import("../services/users.service.js")).default;
      const usersService = new UsersService();
      const users = await usersService.getAll();
      const plainUsers = users.map(u => u.toObject ? u.toObject() : u);
      res.render("admin/updateUsers", { users: plainUsers });
    } catch (error) {
      res.status(500).send("Error mostrando usuarios");
    }
  }
);

router.post(
  "/admin/products/new",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  productImageUpload.single("image"),
  validateFile({ 
    required: false, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { title, description, category, code, price, stock } = req.body;
      let image = null;
      if (req.file) {
        image = `/images/${req.file.filename}`; // Guarda la ruta del archivo
      }
      const ProductsService = (await import("../services/products.service.js")).default;
      const productsService = new ProductsService();
      await productsService.createProduct({
        title,
        description,
        category,
        code,
        price,
        stock,
        image,
      });
      res.redirect("/admin/products");
    } catch (error) {
      res.status(500).send("Error agregando producto");
    }
  }
);

router.post(
  "/admin/products/delete/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const ProductsService = (await import("../services/products.service.js"))
        .default;
      const productsService = new ProductsService();
      await productsService.deleteProduct(id);
      res.redirect("/admin/products");
    } catch (error) {
      res.status(500).send("Error eliminando producto");
    }
  }
);

// Ruta para mostrar el formulario de edición de producto
router.get(
  "/admin/products/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const ProductsService = (await import("../services/products.service.js"))
        .default;
      const productsService = new ProductsService();
      const product = await productsService.getById(id);
      if (!product) return res.status(404).send("Producto no encontrado");
      res.render("admin/editProduct", {
        product: product.toObject ? product.toObject() : product,
      });
    } catch (error) {
      res.status(500).send("Error mostrando producto para editar");
    }
  }
);

// Ruta para procesar la edición de producto (POST)
router.post(
  "/admin/products/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  productImageUpload.single("image"),
  validateFile({ 
    required: false, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { title, description, category, code, price, stock } = req.body;
      const productId = req.params.id;
      let image = null;

      if (req.file) {
        image = `/images/${req.file.filename}`; // Guarda la ruta del archivo
      }

      const ProductsService = (await import("../services/products.service.js")).default;
      const productsService = new ProductsService();
      const currentProduct = await productsService.getProductById(productId);

      await productsService.updateProduct(productId, {
        title,
        description,
        category,
        code,
        price,
        stock,
        image: image || currentProduct.image,
      });

      res.redirect("/admin/products");
    } catch (error) {
      res.status(500).send("Error actualizando producto");
    }
  }
);

// Ruta para actualizar el rol de un usuario desde el panel admin
router.post(
  "/admin/users/edit/:id",
  authenticatePassport,
  requireAdmin,
  userInSesion,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const UsersService = (await import("../services/users.service.js")).default;
      const usersService = new UsersService();
      await usersService.updateUser(id, { role });
      res.redirect("/admin/users");
    } catch (error) {
      res.status(500).send("Error actualizando rol de usuario");
    }
  }
);

// === Checkout: Vistas de pago para una orden ===

// 3.1 Ver pantalla de pago (selección de método)
router.get(
  "/checkout/payment/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("El ID de la orden no es válido.");
    }
    try {
      let order = await ticketsService.repository.getById(orderId);
      if (!order) return res.status(404).send("Orden no encontrada");
      order = order.toObject ? order.toObject() : order;
      res.render("checkout/payment", { order });
    } catch (error) {
      console.error("[ERROR GET /checkout/payment/:orderId]", error);
      res.status(500).send("Error cargando la pantalla de pago");
    }
  }
);

// 3.2 Reportar Pago Móvil (manual) + comprobante
router.post(
  "/checkout/payment/pagomovil/:orderId",
  authenticatePassport,
  userInSesion,
  paymentProofUpload.single("proof"),
  validateFile({ 
    required: true, 
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024 
  }),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { bank, phone, docId, reference, amount } = req.body;

      if (!bank || !phone || !docId || !reference || !amount) {
        return res.status(400).send("Datos de pago incompletos");
      }

      // Guarda solo la ruta del archivo
      const proofUrl = req.file
        ? `/comprobantes/${req.file.filename}`
        : undefined;

      await paymentsService.captureManual({
        orderId,
        method: "pago_movil",
        payload: { bank, phone, docId, reference, amount, proofUrl }
      });

      res.redirect(`/checkout/thanks/${orderId}`);
    } catch (error) {
      console.error("[ERROR POST /checkout/payment/pagomovil/:orderId]", error);
      res.status(500).send("Error reportando Pago Móvil");
    }
  }
);

// 3.3 Reportar Zelle (manual)
router.post(
  "/checkout/payment/zelle/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { email, reference, amount } = req.body;

      await paymentsService.captureManual({
        orderId,
        method: "zelle",
        payload: { email, reference, amount }
      });

      res.redirect(`/checkout/thanks/${orderId}`);
    } catch (error) {
      console.error("[ERROR POST /checkout/payment/zelle/:orderId]", error);
      res.status(500).send("Error reportando Zelle");
    }
  }
);

// 3.4 Pantalla de gracias
router.get(
  "/checkout/thanks/:orderId",
  authenticatePassport,
  userInSesion,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      let order = await ticketsService.repository.getById(orderId);
      if (!order) return res.status(404).send("Orden no encontrada");
      order = order.toObject ? order.toObject() : order;
      res.render("checkout/thanks", { order });
    } catch (error) {
      console.error("[ERROR GET /checkout/thanks/:orderId]", error);
      res.status(500).send("Error mostrando confirmación");
    }
  }
);

// OWASP - Middleware de manejo de errores de multer
router.use(handleMulterError);

export default router;
