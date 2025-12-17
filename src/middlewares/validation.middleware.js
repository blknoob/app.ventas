import mongoose from "mongoose";
import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Validación de IDs de MongoDB
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Error de Validación',
          message: `Parámetro ${paramName} es requerido`
        });
      }
      return res.status(400).json({
        success: false,
        message: `Parámetro ${paramName} es requerido`,
        code: 'MISSING_PARAMETER'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Error de Validación',
          message: `El ID ${paramName} no es válido`
        });
      }
      return res.status(400).json({
        success: false,
        message: `El ID ${paramName} no es válido`,
        code: 'INVALID_OBJECT_ID'
      });
    }

    next();
  };
};

// Validación de datos del carrito
export const validateCartData = (req, res, next) => {
  const { productId, quantity } = req.body;

  const errors = [];

  if (!productId) {
    errors.push('ID del producto es requerido');
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.push('ID del producto no es válido');
  }

  if (quantity !== undefined) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push('La cantidad debe ser un número positivo');
    }
    if (qty > 100) {
      errors.push('La cantidad máxima permitida es 100');
    }
  }

  if (errors.length > 0) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error de Validación',
        message: errors.join('. ')
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Datos de validación incorrectos',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Convertir quantity a número si existe
  if (quantity !== undefined) {
    req.body.quantity = parseInt(quantity);
  }

  next();
};

// Validación de datos de pago
export const validatePaymentData = (req, res, next) => {
  const { method, amount, reference } = req.body;

  const errors = [];
  const allowedMethods = ['pago_movil', 'zelle', 'transfer'];

  if (!method) {
    errors.push('Método de pago es requerido');
  } else if (!allowedMethods.includes(method)) {
    errors.push(`Método de pago debe ser uno de: ${allowedMethods.join(', ')}`);
  }

  if (!amount) {
    errors.push('Monto es requerido');
  } else {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      errors.push('El monto debe ser un número positivo');
    }
    if (amt > 10000) {
      errors.push('El monto máximo permitido es 10,000');
    }
  }

  if (method !== 'zelle' && !reference) {
    errors.push('Referencia de pago es requerida para este método');
  }

  if (errors.length > 0) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error en Datos de Pago',
        message: errors.join('. ')
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Datos de pago inválidos',
      errors,
      code: 'PAYMENT_VALIDATION_ERROR'
    });
  }

  // Convertir amount a número
  req.body.amount = parseFloat(amount);

  next();
};

// Validación de archivos de imagen
export const validateImageFile = (req, res, next) => {
  if (!req.file) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Error de Archivo',
        message: 'Se requiere un archivo de imagen'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Se requiere un archivo de imagen',
      code: 'FILE_REQUIRED'
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Tipo de Archivo Inválido',
        message: 'Solo se permiten archivos JPEG, PNG, GIF o WebP'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP',
      code: 'INVALID_FILE_TYPE'
    });
  }

  if (req.file.size > maxSize) {
    if (req.accepts('html')) {
      return res.status(400).render('error', {
        title: 'Archivo Demasiado Grande',
        message: 'El archivo no puede superar los 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB permitido',
      code: 'FILE_TOO_LARGE'
    });
  }

  next();
};

// OWASP - Esquemas de validación robustos con Joi
const schemas = {
  user: {
    register: Joi.object({
      first_name: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
      last_name: Joi.string().min(2).max(50).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
      email: Joi.string().email().max(100).lowercase().required(),
      password: Joi.string().min(8).max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
        }),
      age: Joi.number().integer().min(13).max(120).required()
    }),
    
    login: Joi.object({
      email: Joi.string().email().max(100).required(),
      password: Joi.string().min(1).max(128).required()
    })
  },

  product: {
    create: Joi.object({
      title: Joi.string().min(3).max(100).required(),
      description: Joi.string().min(10).max(500).required(),
      category: Joi.string().min(3).max(50).required(),
      price: Joi.number().positive().precision(2).max(999999.99).required(),
      code: Joi.string().alphanum().min(3).max(20).uppercase().required(),
      stock: Joi.number().integer().min(0).max(999999).required()
    })
  }
};

// OWASP - Middleware de validación robusto
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        errors: errors
      });

      if (req.accepts('html')) {
        return res.status(400).render('error', {
          title: 'Datos Inválidos',
          message: 'Por favor, revisa los datos ingresados.',
          errors: errors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        code: 'VALIDATION_ERROR'
      });
    }

    req.body = value;
    next();
  };
};

export { schemas };
