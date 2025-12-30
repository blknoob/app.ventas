import mongoose from 'mongoose';
import 'dotenv/config';

await mongoose.connect(process.env.MONGO_URI);

console.log('👥 Usuarios existentes:');
const users = await mongoose.connection.db.collection('users').find({}).toArray();
users.forEach((user, i) => {
  console.log(`${i + 1}. ${user.email} - ${user.role || 'user'}`);
});

console.log('\n🎫 Tickets existentes:');
const tickets = await mongoose.connection.db.collection('tickets').find({}).toArray();
tickets.forEach((ticket, i) => {
  console.log(`${i + 1}. ${ticket.code} - ${ticket.purchaser} - $${ticket.amount} (productos: ${ticket.products?.length || 0})`);
});

await mongoose.connection.close();