import Product from "./models/products.model.js";
import { mapCategory } from "../../../utils/categoryMapper.js";

class ProductsDAO {
  async create(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Error buscando producto por ID: ${error.message}`);
    }
  }

  async findByCode(code) {
    try {
      return await Product.findOne({ code });
    } catch (error) {
      throw new Error(`Error al buscar producto por código: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      console.log('🔍 ProductsDAO: Consultando productos en la base de datos...');
      const products = await Product.find({}).sort({ createdAt: -1 });
      console.log(`📊 ProductsDAO: Encontrados ${products.length} productos en BD`);
      
      // Mapear categorías automáticamente para productos que no tienen mainCategory/subCategory
      const mappedProducts = products.map(product => {
        const productObj = product.toObject();
        
        if (!productObj.mainCategory || !productObj.subCategory) {
          const mapped = mapCategory(productObj.category);
          productObj.mainCategory = mapped.mainCategory;
          productObj.subCategory = mapped.subCategory;
        }
        
        return productObj;
      });
      
      mappedProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} - ${product.mainCategory} > ${product.subCategory}`);
      });
      
      return mappedProducts;
    } catch (error) {
      console.error('❌ Error en ProductsDAO.findAll:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      return await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await Product.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  async reduceStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.stock < quantity) {
        throw new Error("Stock insuficiente");
      }

      // Usar findByIdAndUpdate para evitar validación completa del schema
      return await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { new: true, runValidators: false }
      );
    } catch (error) {
      throw new Error(`Error al reducir stock: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Error buscando producto: ${error.message}`);
    }
  }
}

export default ProductsDAO;
