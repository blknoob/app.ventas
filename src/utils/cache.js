import NodeCache from 'node-cache';

// Configuración del cache
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar expiración cada minuto
  useClones: false, // Mejor performance
  deleteOnExpire: true
});

// Configuraciones específicas para diferentes tipos de datos
const CACHE_CONFIG = {
  products: {
    ttl: 600, // 10 minutos para productos
    keyPrefix: 'products:'
  },
  categories: {
    ttl: 1800, // 30 minutos para categorías
    keyPrefix: 'categories:'
  },
  user: {
    ttl: 900, // 15 minutos para datos de usuario
    keyPrefix: 'user:'
  },
  general: {
    ttl: 300, // 5 minutos general
    keyPrefix: 'general:'
  }
};

// Función helper para generar claves de cache
const generateKey = (type, identifier) => {
  const prefix = CACHE_CONFIG[type]?.keyPrefix || CACHE_CONFIG.general.keyPrefix;
  return `${prefix}${identifier}`;
};

// Función helper para obtener TTL
const getTTL = (type) => {
  return CACHE_CONFIG[type]?.ttl || CACHE_CONFIG.general.ttl;
};

// Cache para productos
export const productCache = {
  get: (productId) => {
    const key = generateKey('products', productId);
    return cache.get(key);
  },

  set: (productId, data) => {
    const key = generateKey('products', productId);
    const ttl = getTTL('products');
    return cache.set(key, data, ttl);
  },

  getAll: () => {
    const key = generateKey('products', 'all');
    return cache.get(key);
  },

  setAll: (products) => {
    const key = generateKey('products', 'all');
    const ttl = getTTL('products');
    return cache.set(key, products, ttl);
  },

  invalidate: (productId) => {
    const key = generateKey('products', productId);
    const allKey = generateKey('products', 'all');
    cache.del([key, allKey]);
  },

  invalidateAll: () => {
    const keys = cache.keys().filter(key => key.startsWith(CACHE_CONFIG.products.keyPrefix));
    if (keys.length > 0) {
      cache.del(keys);
    }
  }
};

// Cache para usuarios
export const userCache = {
  get: (userId) => {
    const key = generateKey('user', userId);
    return cache.get(key);
  },

  set: (userId, data) => {
    const key = generateKey('user', userId);
    const ttl = getTTL('user');
    return cache.set(key, data, ttl);
  },

  invalidate: (userId) => {
    const key = generateKey('user', userId);
    cache.del(key);
  }
};

// Cache general
export const generalCache = {
  get: (key) => {
    const fullKey = generateKey('general', key);
    return cache.get(fullKey);
  },

  set: (key, data, customTTL = null) => {
    const fullKey = generateKey('general', key);
    const ttl = customTTL || getTTL('general');
    return cache.set(fullKey, data, ttl);
  },

  invalidate: (key) => {
    const fullKey = generateKey('general', key);
    cache.del(fullKey);
  }
};

// Funciones de utilidad
export const cacheUtils = {
  // Limpiar todo el cache
  clearAll: () => {
    cache.flushAll();
  },

  // Obtener estadísticas del cache
  getStats: () => {
    return cache.getStats();
  },

  // Verificar si una clave existe
  has: (type, identifier) => {
    const key = generateKey(type, identifier);
    return cache.has(key);
  },

  // Obtener TTL restante de una clave
  getTTL: (type, identifier) => {
    const key = generateKey(type, identifier);
    return cache.getTtl(key);
  }
};

// Middleware para cache de respuestas HTTP
export const cacheMiddleware = (type, identifierFn, options = {}) => {
  return (req, res, next) => {
    const identifier = typeof identifierFn === 'function' ? identifierFn(req) : identifierFn;
    const cacheKey = generateKey(type, identifier);

    // Intentar obtener del cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && !options.skipCache) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Guardar la función original send
    const originalSend = res.json;

    // Sobrescribir res.json para cachear la respuesta
    res.json = function(data) {
      // Cachear solo respuestas exitosas
      if (data.success !== false && !options.skipCache) {
        const ttl = options.ttl || getTTL(type);
        cache.set(cacheKey, data.data || data, ttl);
      }

      // Restaurar y ejecutar la función original
      res.json = originalSend;
      return res.json(data);
    };

    next();
  };
};

export default cache;