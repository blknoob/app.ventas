import { verifyToken } from "../utils/jwt.js";
import UsersRepository from "../repositories/users.repository.js";

const usersRepository = new UsersRepository();

// Middleware unificado que funciona para APIs y vistas
export const authenticate = (req, res, next) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    // Para vistas: redirigir a login
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    // Para APIs: retornar error JSON
    return res.status(401).json({
      success: false,
      message: "Token requerido",
      code: "TOKEN_REQUIRED"
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
      code: "TOKEN_INVALID"
    });
  }

  // Adjuntar usuario a request
  req.user = decoded;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({
      success: false,
      message: "No autenticado",
      code: "NOT_AUTHENTICATED"
    });
  }

  if (req.user.role !== "admin") {
    if (req.accepts('html')) {
      return res.render("permissions", {
        title: "Sin Permisos",
        message: "Solo administradores pueden acceder a esta sección"
      });
    }
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: Se requieren permisos de administrador",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }

  next();
};

// Alias para compatibilidad con código existente
export const authenticateToken = authenticate;
export const isAdmin = requireAdmin;
