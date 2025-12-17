import { Router } from "express";
import UsersController from "../controllers/users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validate, schemas } from "../middlewares/validation.middleware.js";

const router = Router();
const usersController = new UsersController();

// OWASP - Rutas con validación robusta
router.post("/register", validate(schemas.user.register), usersController.register);
router.post("/login", validate(schemas.user.login), usersController.login);
router.post("/logout", usersController.logout);

router.post("/forgot-password", usersController.forgotPassword);
router.post("/reset-password", usersController.resetPassword);

router.get("/current", authenticateToken, usersController.current);
router.put(
  "/change-password",
  authenticateToken,
  usersController.changePassword
);

export default router;
