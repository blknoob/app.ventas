// Script temporal para limpiar el caché
import { cacheUtils, productCache } from './src/utils/cache.js';

console.log('🧹 Limpiando caché...');

// Limpiar todo el caché
cacheUtils.clearAll();

console.log('✅ Caché limpiado completamente');

// Verificar que se limpió
const stats = cacheUtils.getStats();
console.log('📊 Estadísticas del caché después de limpiar:', stats);

process.exit(0);