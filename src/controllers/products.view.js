import ProductsService from "../services/products.service.js";

const productsService = new ProductsService();

class ProductsViewController {
  async getProductsView(req, res, next) {
    try {
      console.log('🎯 ProductsViewController: Solicitando productos...');
      const products = await productsService.getAll();
      console.log(`📋 ProductsViewController: Recibidos ${products.length} productos del servicio`);
      
      const { category, subcategory } = req.query;
      let filteredProducts = products.map((p) => (p.toObject ? p.toObject() : p));
      
      // Filtrar por categoría principal si se especifica
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.mainCategory === category
        );
      }
      
      // Filtrar por subcategoría si se especifica
      if (subcategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.subCategory === subcategory
        );
      }
      
      req.products = filteredProducts;
      req.currentCategory = category;
      req.currentSubCategory = subcategory;
      
      console.log(`✅ ProductsViewController: Productos filtrados: ${req.products.length}`);
      if (category) console.log(`🏷️ Categoría: ${category}`);
      if (subcategory) console.log(`🏷️ Subcategoría: ${subcategory}`);
      
      next();
    } catch (error) {
      console.error('❌ Error en ProductsViewController:', error);
      next(error);
    }
  }
}

export default ProductsViewController;
