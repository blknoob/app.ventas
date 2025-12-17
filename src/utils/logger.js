import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Definir niveles de log personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Configuración de transports con rotación diaria
const transports = [
  // Log de errores con rotación diaria (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '30d', // Mantener logs por 30 días
    zippedArchive: true
  }),

  // Log de seguridad para eventos críticos (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'warn',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '90d', // Mantener logs de seguridad por 90 días
    zippedArchive: true
  }),

  // Log general con rotación diaria
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: customFormat,
    maxSize: '50m',
    maxFiles: '14d', // Mantener logs generales por 14 días
    zippedArchive: true
  }),

  // Log HTTP requests para auditoría (OWASP - Logging)
  new winston.transports.DailyRotateFile({
    filename: path.join(logsDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Formato específico para logs de acceso
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta
        });
      })
    ),
    maxSize: '100m',
    maxFiles: '30d',
    zippedArchive: true
  })
];

// Agregar console transport en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      )
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// Agregar colores a winston
winston.addColors(customLevels.colors);

// Función helper para logging HTTP requests
export const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

// Función helper para logging de errores de base de datos
export const logDatabaseError = (operation, collection, error) => {
  logger.error(`Database Error - ${operation} on ${collection}`, {
    operation,
    collection,
    error: error.message,
    stack: error.stack
  });
};

// Función helper para logging de operaciones de negocio
export const logBusinessOperation = (operation, data, user = null) => {
  logger.info(`Business Operation: ${operation}`, {
    operation,
    user: user?.email || 'anonymous',
    data
  });
};

// OWASP - Logging de eventos de seguridad críticos
export const logSecurityEvent = (event, details, req = null) => {
  const securityLog = {
    event,
    timestamp: new Date().toISOString(),
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent'),
    url: req?.originalUrl,
    method: req?.method,
    user: req?.user?.email || 'anonymous',
    details,
    severity: 'HIGH'
  };

  logger.warn(`SECURITY EVENT: ${event}`, securityLog);
};

// OWASP - Logging de intentos de autenticación
export const logAuthAttempt = (type, email, success, req, reason = null) => {
  const authLog = {
    type, // 'login', 'register', 'password_reset', etc.
    email,
    success,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
    reason: reason || (success ? 'valid_credentials' : 'invalid_credentials')
  };

  if (success) {
    logger.info(`AUTH SUCCESS: ${type}`, authLog);
  } else {
    logger.warn(`AUTH FAILURE: ${type}`, authLog);
  }
};

// OWASP - Logging de rate limiting
export const logRateLimit = (ip, endpoint, limit, windowMs, req = null) => {
  const rateLimitLog = {
    ip,
    endpoint,
    limit,
    windowMs,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
    blocked: true
  };

  logger.warn('RATE LIMIT EXCEEDED', rateLimitLog);
};

// OWASP - Logging de validación de entrada
export const logValidationError = (field, value, error, req = null) => {
  const validationLog = {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value, // Truncar valores largos
    error: error.message,
    ip: req?.ip,
    url: req?.originalUrl,
    timestamp: new Date().toISOString()
  };

  logger.warn('VALIDATION ERROR', validationLog);
};