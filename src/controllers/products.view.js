import ProductsService from "../services/products.service.js";

const productsService = new ProductsService();

class ProductsViewController {
  async getProductsView(req, res, next) {
    try {
      console.log('🎯 ProductsViewController: Solicitando productos...');
      const products = await productsService.getAll();
      console.log(`📋 ProductsViewController: Recibidos ${products.length} productos del servicio`);
      req.products = products.map((p) => (p.toObject ? p.toObject() : p));
      console.log(`✅ ProductsViewController: Productos procesados para la vista: ${req.products.length}`);
      next();
    } catch (error) {
      console.error('❌ Error en ProductsViewController:', error);
      next(error);
    }
  }
}

export default ProductsViewController;
