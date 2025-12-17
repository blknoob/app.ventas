import { logger, logSecurityEvent, logRateLimit } from "../utils/logger.js";

// Rate limiting simple en memoria
const rateLimitStore = new Map();

// OWASP - Rate limiting más estricto
const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 3 }, // 3 intentos por 15 minutos para auth (OWASP)
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 por minuto para API general
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 por 15 minutos para operaciones críticas
  resetPassword: { windowMs: 60 * 60 * 1000, maxRequests: 2 }, // 2 por hora para reset password
  registration: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 } // 5 registros por día por IP
};

// Función helper para limpiar entradas expiradas
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Middleware de rate limiting
export const rateLimit = (type = 'api') => {
  const config = RATE_LIMITS[type];

  return (req, res, next) => {
    const key = `${req.ip}:${type}`;
    const now = Date.now();

    // Limpiar entradas expiradas periódicamente
    if (Math.random() < 0.01) { // 1% de probabilidad
      cleanupExpiredEntries();
    }

    let userData = rateLimitStore.get(key);

    if (!userData) {
      userData = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Resetear contador si la ventana expiró
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + config.windowMs;
    }

    userData.count++;
    rateLimitStore.set(key, userData);

    // Verificar límite
    if (userData.count > config.maxRequests) {
      // OWASP - Log evento de seguridad por rate limiting
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        endpoint: req.originalUrl,
        attempts: userData.count,
        limit: config.maxRequests,
        windowMs: config.windowMs
      }, req);

      logRateLimit(req.ip, type, config.maxRequests, config.windowMs, req);

      const resetIn = Math.ceil((userData.resetTime - now) / 1000);

      if (req.accepts('html')) {
        return res.status(429).render('error', {
          title: 'Demasiadas Solicitudes',
          message: `Has excedido el límite de solicitudes. Intenta nuevamente en ${resetIn} segundos.`
        });
      }

      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetIn
      });
    }

    // Agregar headers de rate limit
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - userData.count),
      'X-RateLimit-Reset': Math.ceil(userData.resetTime / 1000)
    });

    next();
  };
};

// Middleware para sanitizar entrada
export const sanitizeInput = (req, res, next) => {
  // Función recursiva para sanitizar objetos
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remover caracteres de control y normalizar
      return value
        .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
        .trim()
        .substring(0, 10000); // Limitar longitud
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue).slice(0, 100); // Limitar arrays
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        // Solo permitir keys alfanuméricos y guiones bajos
        if (/^[a-zA-Z0-9_]+$/.test(key)) {
          sanitized[key] = sanitizeValue(val);
        }
      }
      return sanitized;
    }

    return value;
  };

  // Sanitizar body y params (query es de solo lectura en Express)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// Middleware para validar headers de seguridad
export const securityHeaders = (req, res, next) => {
  // Headers de seguridad básicos
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  });

  // Agregar HSTS en producción
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

// Middleware para detectar ataques comunes
export const detectAttacks = (req, res, next) => {
  const suspicious = [];

  // Detectar SQL injection básica
  const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i;
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlPatterns.test(value)) {
      suspicious.push('Posible SQL injection detectado');
    }
  };

  // Verificar en body, query y params
  [req.body, req.query, req.params].forEach(obj => {
    if (obj && typeof obj === 'object') {
      JSON.stringify(obj, (key, value) => {
        checkValue(value);
        return value;
      });
    }
  });

  // Detectar URLs sospechosas
  if (req.url.includes('..') || req.url.includes('%2e%2e')) {
    suspicious.push('Posible path traversal detectado');
  }

  // Loggear si se detecta algo sospechoso
  if (suspicious.length > 0) {
    // OWASP - Log evento de seguridad crítico
    logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
      suspiciousActivities: suspicious,
      blockedRequest: true
    }, req);

    // Bloquear la solicitud
    if (req.accepts('html')) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'Actividad sospechosa detectada.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por actividad sospechosa.',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  next();
};

// Middleware para logging de seguridad
export const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Loggear requests que toman mucho tiempo o tienen status de error
    if (duration > 5000 || res.statusCode >= 400) {
      logger.info('Security Log - Request completada', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user?.email || 'anonymous'
      });
    }
  });

  next();
};