import UserDTO from "../dtos/user.dto.js";
import UsersService from "../services/users.service.js";
import { generateToken } from "../utils/jwt.js";
import { logAuthAttempt, logSecurityEvent } from "../utils/logger.js";

const usersService = new UsersService();

class UsersController {
  async getCurrentView(req, res) {
    try {
      if (!req.user) {
        return res.redirect("/login");
      }

      const user = req.user.toObject
        ? req.user.toObject()
        : JSON.parse(JSON.stringify(req.user));
      res.render("users/current", { user });
    } catch (error) {
      res.status(500).send("Error mostrando el perfil de usuario");
    }
  }

  async register(req, res) {
    try {
      const { first_name, last_name, email, password, age } = req.body;

      const response = await usersService.createUser({
        first_name,
        last_name,
        email,
        password,
        age,
        role: "user",
      });

      if (response.error) {
        // OWASP - Log intento de registro fallido
        logAuthAttempt('register', email, false, req, response.message);
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      // OWASP - Log registro exitoso
      logAuthAttempt('register', email, true, req);

      const token = generateToken({
        _id: response._id,
        email: response.email,
        role: response.role,
        first_name: response.first_name,
        last_name: response.last_name,
      });
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.redirect("/current");
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const response = await usersService.login(email, password);

      if (response.error) {
        // OWASP - Log intento de login fallido
        logAuthAttempt('login', email, false, req, response.message);
        
        if (
          req.headers.accept &&
          req.headers.accept.includes("application/json")
        ) {
          return res.status(response.type || 500).json({
            status: "error",
            message: response.message,
          });
        }

        return res.redirect("/login");
      }

      // OWASP - Log login exitoso
      logAuthAttempt('login', email, true, req);

      const token = generateToken({
        _id: response.user._id,
        email: response.user.email,
        role: response.user.role,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
      });
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      if (
        req.headers.accept &&
        req.headers.accept.includes("application/json")
      ) {
        return res.json({
          status: "success",
          message: "Login exitoso",
          user: new UserDTO(response.user),
          token: token,
        });
      }

      return res.redirect("/");
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("access_token");
      res.json({
        status: "success",
        message: "Logout exitoso",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  async current(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
      }

      res.json({
        status: "success",
        user: new UserDTO(req.user),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error obteniendo usuario actual",
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { newPassword } = req.body;
      const userId = req.user._id;

      const response = await usersService.changePassword(userId, newPassword);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      res.json({ status: "success", message: response.message });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const response = await usersService.forgotPassword(email);

      if (response.error) {
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      if (
        !req.headers.accept ||
        !req.headers.accept.includes("application/json")
      ) {
        return res.redirect("/login");
      }

      res.json({
        status: "success",
        message:
          "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const response = await usersService.resetPassword(token, newPassword);

      if (response.error) {
        if (
          !req.headers.accept ||
          !req.headers.accept.includes("application/json")
        ) {
          return res.redirect("/login?error=token");
        }
        return res.status(response.type || 500).json({
          status: "error",
          message: response.message,
        });
      }

      if (
        !req.headers.accept ||
        !req.headers.accept.includes("application/json")
      ) {
        return res.redirect("/login?reset=ok");
      }

      res.json({
        status: "success",
        message: "Contraseña restablecida exitosamente",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  }
}

export default UsersController;
