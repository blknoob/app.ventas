// Repository de productos - Sencillo y directo
import ProductsDAO from './daos/mongo/products.dao.js';

class ProductsRepository {
    constructor() {
        this.dao = new ProductsDAO();
    }

    async findById(id) {
        try {
            return await this.dao.findById(id);
        } catch (error) {
            throw new Error(`Error buscando producto: ${error.message}`);
        }
    }

    async findAll(options = {}) {
        try {
            return await this.dao.findAll(options);
        } catch (error) {
            throw new Error(`Error buscando productos: ${error.message}`);
        }
    }

    async create(productData) {
        try {
            return await this.dao.create(productData);
        } catch (error) {
            throw new Error(`Error creando producto: ${error.message}`);
        }
    }

    async update(id, productData) {
        try {
            return await this.dao.update(id, productData);
        } catch (error) {
            throw new Error(`Error actualizando producto: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            return await this.dao.delete(id);
        } catch (error) {
            throw new Error(`Error eliminando producto: ${error.message}`);
        }
    }

    async findByCode(code) {
        try {
            return await this.dao.findByCode(code);
        } catch (error) {
            throw new Error(`Error buscando producto por código: ${error.message}`);
        }
    }

    async reduceStock(productId, quantity) {
        try {
            return await this.dao.reduceStock(productId, quantity);
        } catch (error) {
            throw new Error(`Error reduciendo stock: ${error.message}`);
        }
    }

    async getById(id) {
        try {
            return await this.dao.getById(id);
        } catch (error) {
            throw new Error(`Error buscando producto por ID: ${error.message}`);
        }
    }
}

export default ProductsRepository;
