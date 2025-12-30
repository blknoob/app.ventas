import mongoose from 'mongoose';
import 'dotenv/config';

await mongoose.connect(process.env.MONGO_URI);

// Verificar tickets existentes
const tickets = await mongoose.connection.db.collection('tickets').find({}).toArray();
console.log('📦 Tickets en BD:', tickets.length);

tickets.forEach((ticket, i) => {
  console.log(`${i + 1}. ${ticket.code} - ${ticket.purchaser} - $${ticket.amount}`);
  console.log(`   Productos: ${ticket.products?.length || 0}`);
});

await mongoose.connection.close();