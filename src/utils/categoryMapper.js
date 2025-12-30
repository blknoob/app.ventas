/**
 * Mapeo de categorías actuales a categorías principales y subcategorías
 */
export const categoryMapping = {
  'Lácteos': {
    mainCategory: 'Alimentación',
    subCategory: 'Lácteos'
  },
  'Panadería': {
    mainCategory: 'Alimentación',
    subCategory: 'Panadería'
  },
  'Huevos': {
    mainCategory: 'Alimentación',
    subCategory: 'Huevos y Derivados'
  },
  'Almacén': {
    mainCategory: 'Alimentación',
    subCategory: 'Despensa'
  },
  'Frutas': {
    mainCategory: 'Alimentación',
    subCategory: 'Frutas'
  },
  'Verduras': {
    mainCategory: 'Alimentación',
    subCategory: 'Verduras'
  },
  'Limpieza': {
    mainCategory: 'Limpieza',
    subCategory: 'Productos de Limpieza'
  },
  'Categoría Actualizada': {
    mainCategory: 'Alimentación',
    subCategory: 'Varios'
  }
};

/**
 * Función para obtener categoría principal y subcategoría desde categoría actual
 */
export function mapCategory(currentCategory) {
  const mapping = categoryMapping[currentCategory];
  if (mapping) {
    return {
      mainCategory: mapping.mainCategory,
      subCategory: mapping.subCategory
    };
  }
  
  // Default para categorías no mapeadas
  return {
    mainCategory: 'Alimentación',
    subCategory: currentCategory || 'Sin categoría'
  };
}

/**
 * Lista de categorías principales disponibles
 */
export const mainCategories = [
  'Alimentación',
  'Limpieza', 
  'Higiene Personal',
  'Bebidas',
  'Hogar',
  'Bebés y Niños'
];

/**
 * Subcategorías por categoría principal
 */
export const subCategoriesByMain = {
  'Alimentación': [
    'Lácteos',
    'Carnes y Pollo',
    'Frutas',
    'Verduras',
    'Panadería',
    'Huevos y Derivados',
    'Despensa',
    'Congelados',
    'Varios'
  ],
  'Limpieza': [
    'Productos de Limpieza',
    'Papel Higiénico y Servilletas',
    'Detergentes',
    'Desinfectantes'
  ],
  'Higiene Personal': [
    'Cuidado Personal',
    'Cuidado del Cabello',
    'Cuidado Oral',
    'Perfumería'
  ],
  'Bebidas': [
    'Gaseosas',
    'Jugos',
    'Agua',
    'Bebidas Alcohólicas',
    'Bebidas Calientes'
  ],
  'Hogar': [
    'Utensilios',
    'Decoración',
    'Jardinería',
    'Electrodomésticos'
  ],
  'Bebés y Niños': [
    'Pañales',
    'Alimentos Infantiles',
    'Cuidado del Bebé',
    'Juguetes'
  ]
};