/**
 * @fileoverview Configuración de Passport.js para autenticación JWT
 *
 * Sistema de autenticación basado en JSON Web Tokens utilizando cookies.
 * Implementa estrategia JWT con extracción desde cookies para mayor seguridad
 * en aplicaciones web, evitando almacenamiento en localStorage.
 *
 * CARACTERÍSTICAS:
 * - Autenticación JWT desde cookies
 * - Serialización/deserialización de usuarios
 * - Integración con repositorio de usuarios
 * - Manejo robusto de errores
 * - Extractor personalizado para cookies
 *
 * SEGURIDAD:
 * - Tokens en cookies HttpOnly
 * - Validación de integridad JWT
 * - Verificación de existencia de usuario
 * - Manejo seguro de errores sin exposición
 *
 * @author Sistema SuperMercado Online
 * @version 1.0.0
 * @since 2026-01-02
 */

import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import UsersRepository from "../../repositories/users.repository.js";

const { JWT_SECRET } = process.env;

/**
 * Extrae token JWT desde cookies de la request
 *
 * Función extractora personalizada que busca el token de acceso
 * en las cookies de la petición HTTP, específicamente en 'access_token'.
 *
 * SEGURIDAD:
 * - Validación de existencia de request y cookies
 * - Retorno null si no encuentra token
 * - No exposición de errores internos
 *
 * @function cookieExtractor
 * @param {Object} req - Objeto request de Express
 * @returns {string|null} Token JWT o null si no existe
 */
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["access_token"];
  }
  return token;
};

/**
 * Inicializa y configura Passport.js con estrategia JWT
 *
 * Configura la estrategia de autenticación JWT, serialización y
 * deserialización de usuarios para sesiones persistentes.
 *
 * CONFIGURACIÓN ESTRATEGIA JWT:
 * - Secret desde variable de entorno
 * - Extracción desde cookies
 * - Verificación de usuario en base de datos
 * - Manejo de errores de autenticación
 *
 * SERIALIZACIÓN:
 * - serializeUser: Guarda ID de usuario en sesión
 * - deserializeUser: Recupera usuario completo por ID
 *
 * CASOS DE USO:
 * - Login con JWT
 * - Middleware de autenticación en rutas protegidas
 * - Persistencia de sesión entre requests
 * - Validación automática de tokens
 *
 * @function initializePassport
 * @returns {void}
 */

const initializePassport = () => {
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        secretOrKey: JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      },
      async (payload, done) => {
        try {
          const usersRepository = new UsersRepository();
          const user = await usersRepository.findById(payload._id);
          if (!user) return done(null, false);
          return done(null, user, payload);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const usersRepository = new UsersRepository();
      const user = await usersRepository.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export { initializePassport };
