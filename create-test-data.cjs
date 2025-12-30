const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

// Esquemas
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  age: Number,
  password: String,
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
  role: { type: String, default: "user" }
}, { timestamps: true, versionKey: false });

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  price: Number,
  stock: Number,
  mainCategory: String,
  subCategory: String,
  category: String,
  image: String,
}, { timestamps: true, versionKey: false });

const ticketSchema = new mongoose.Schema({
  code: String,
  amount: Number,
  purchaser: String,
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    price: Number
  }]
}, { timestamps: true, versionKey: false });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

async function createTestData() {
  try {
    console.log('🧪 Creando datos de prueba...\n');
    
    // Buscar productos existentes
    const products = await Product.find({}).limit(3);
    console.log(`📦 Productos disponibles: ${products.length}`);
    
    if (products.length === 0) {
      console.log('❌ No hay productos. Creando algunos...');
      return;
    }
    
    // Crear un usuario de prueba
    const testUser = {
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan.test@mail.com',
      age: 30,
      password: '$2b$10$dummy.hash.for.testing',
      role: 'user'
    };
    
    // Verificar si el usuario ya existe
    let existingUser = await User.findOne({ email: testUser.email });
    if (!existingUser) {
      existingUser = await User.create(testUser);
      console.log('✅ Usuario creado:', testUser.email);
    } else {
      console.log('👤 Usuario ya existe:', testUser.email);
    }
    
    // Crear algunos tickets de prueba
    const testTickets = [
      {
        code: `TEST-${Date.now()}-001`,
        amount: products[0].price * 2,
        purchaser: testUser.email,
        products: [{
          product: products[0]._id,
          quantity: 2,
          price: products[0].price
        }]
      },
      {
        code: `TEST-${Date.now()}-002`,
        amount: products[1].price * 1 + products[2].price * 3,
        purchaser: testUser.email,
        products: [
          {
            product: products[1]._id,
            quantity: 1,
            price: products[1].price
          },
          {
            product: products[2]._id,
            quantity: 3,
            price: products[2].price
          }
        ]
      }
    ];
    
    // Crear tickets
    for (const ticketData of testTickets) {
      const existingTicket = await Ticket.findOne({ code: ticketData.code });
      if (!existingTicket) {
        await Ticket.create(ticketData);
        console.log(`🎫 Ticket creado: ${ticketData.code} - $${ticketData.amount}`);
      }
    }
    
    console.log('\n✅ Datos de prueba creados');
    console.log('🔑 Usuario de prueba: juan.test@mail.com');
    console.log('🔒 Contraseña: cualquier cosa (para testing)');
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

createTestData();