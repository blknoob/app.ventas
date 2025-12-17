import multer from "multer";
import path from "path";
import fs from "fs";
import { logSecurityEvent, logValidationError } from "../utils/logger.js";

// OWASP - Configuración segura de multer para subida de archivos

// Tipos MIME permitidos para comprobantes de pago
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  documents: [
    'application/pdf',
    'text/plain'
  ]
};

// Configuración de tamaños máximos (en bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5MB para imágenes
  document: 10 * 1024 * 1024, // 10MB para documentos
  default: 2 * 1024 * 1024   // 2MB por defecto
};

// Función para validar MIME type
const validateMimeType = (file, allowedTypes = []) => {
  const allAllowed = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents, ...allowedTypes];
  return allAllowed.includes(file.mimetype);
};

// Función para validar tamaño de archivo
const validateFileSize = (file, maxSize = MAX_FILE_SIZES.default) => {
  return file.size <= maxSize;
};

// Función para sanitizar nombre de archivo
const sanitizeFilename = (filename) => {
  // Remover caracteres peligrosos y normalizar
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales
    .replace(/_{2,}/g, '_')          // Reducir múltiples guiones bajos
    .replace(/^[._]/, '')            // Remover puntos/guiones al inicio
    .substring(0, 100);              // Limitar longitud
};

// Configuración de storage segura
export const createSecureStorage = (destination = 'uploads/', options = {}) => {
  // Crear directorio si no existe
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // OWASP - Generar nombre de archivo seguro
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname).toLowerCase();
      const sanitizedName = sanitizeFilename(path.basename(file.originalname, extension));
      
      const filename = `${timestamp}-${randomSuffix}-${sanitizedName}${extension}`;
      cb(null, filename);
    }
  });
};

// Middleware de validación de archivos
export const validateFile = (options = {}) => {
  const {
    allowedMimeTypes = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents],
    maxFileSize = MAX_FILE_SIZES.default,
    required = false
  } = options;

  return (req, res, next) => {
    const file = req.file;
    
    // Si el archivo no es requerido y no se envió, continuar
    if (!required && !file) {
      return next();
    }

    // Si es requerido pero no se envió
    if (required && !file) {
      logValidationError('file_missing', 'required', new Error('Archivo requerido no proporcionado'), req);
      return res.status(400).json({
        status: 'error',
        message: 'Archivo requerido'
      });
    }

    // Si hay archivo, validar
    if (file) {
      // Validar MIME type
      if (!validateMimeType(file, allowedMimeTypes)) {
        logSecurityEvent('INVALID_FILE_TYPE_UPLOAD', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: allowedMimeTypes
        }, req);

        // Eliminar archivo subido
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(400).json({
          status: 'error',
          message: 'Tipo de archivo no permitido'
        });
      }

      // Validar tamaño
      if (!validateFileSize(file, maxFileSize)) {
        logSecurityEvent('FILE_SIZE_EXCEEDED', {
          filename: file.originalname,
          size: file.size,
          maxSize: maxFileSize
        }, req);

        // Eliminar archivo subido
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(400).json({
          status: 'error',
          message: `Archivo demasiado grande. Máximo permitido: ${Math.round(maxFileSize / 1024 / 1024)}MB`
        });
      }

      // Log subida exitosa
      logSecurityEvent('FILE_UPLOAD_SUCCESS', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        destination: file.path
      }, req);
    }

    next();
  };
};

// Configuración de multer segura para comprobantes de pago
export const createPaymentProofUpload = () => {
  const storage = createSecureStorage('public/comprobantes/');
  
  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZES.image, // 5MB para comprobantes
      files: 1, // Solo un archivo por request
    },
    fileFilter: (req, file, cb) => {
      // Validación inicial en fileFilter
      if (validateMimeType(file, ALLOWED_MIME_TYPES.images)) {
        cb(null, true);
      } else {
        const error = new Error('Tipo de archivo no permitido para comprobante');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    }
  });
};

// Configuración de multer segura para documentos generales
export const createDocumentUpload = () => {
  const storage = createSecureStorage('uploads/documents/');
  
  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZES.document, // 10MB para documentos
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      if (validateMimeType(file)) {
        cb(null, true);
      } else {
        const error = new Error('Tipo de archivo no permitido');
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    }
  });
};

// Manejo de errores de multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logSecurityEvent('MULTER_ERROR', {
      error: error.message,
      code: error.code,
      field: error.field
    }, req);

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'error',
          message: 'Archivo demasiado grande'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          status: 'error',
          message: 'Demasiados archivos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          status: 'error',
          message: 'Campo de archivo inesperado'
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Error al procesar archivo'
        });
    }
  }

  if (error && error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  next(error);
};

export default {
  createSecureStorage,
  validateFile,
  createPaymentProofUpload,
  createDocumentUpload,
  handleMulterError,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};