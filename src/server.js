import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import validateEnvVars from "./configs/env.js";
import { connectDB } from "./configs/db.js";
import { configureHandlebars } from "./configs/handlebars.js";
import { initializePassport } from "./configs/passport/index.js";
import { logRequest } from "./utils/logger.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import {
  rateLimit,
  sanitizeInput,
  detectAttacks,
  securityLogger,
} from "./middlewares/security.middleware.js";
import jwt from "jsonwebtoken";

import indexRouter from "./routes/index.router.js";

dotenv.config();

// OWASP - Validar variables de entorno al inicio
const env = validateEnvVars();

const app = express();
const PORT = env.PORT || 8080;

// OWASP - Configuración de helmet para headers de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// OWASP - Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// OWASP - Configuración segura de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Cambiar nombre por defecto
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 horas en lugar de 24
      sameSite: "strict", // Protección CSRF
    },
  })
);

configureHandlebars(app);

app.use(passport.initialize());
app.use(passport.session());
initializePassport();

app.use((req, res, next) => {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

app.use(express.static("public"));

// Favicon handler
app.get("/favicon.ico", (req, res) => {
  res.status(204).send();
});

// Handler para favicon.ico
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Middlewares de seguridad OWASP (orden importante)
app.use(detectAttacks);
app.use(sanitizeInput);
app.use(securityLogger);

// OWASP - Rate limiting más estricto
app.use("/api/users/login", rateLimit("auth"));
app.use("/api/users/register", rateLimit("registration"));
app.use("/api/users/reset-password", rateLimit("resetPassword"));
app.use("/api/users/forgot-password", rateLimit("resetPassword"));
app.use("/api/", rateLimit("api"));

// Middleware de logging para todas las requests
app.use(logRequest);

app.use("/", indexRouter);

// Middleware para rutas no encontradas
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

startServer();
