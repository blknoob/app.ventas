import express from "express";
import { connectDB } from "./src/configs/db.js";

// Script de debug simple para identificar el problema
const app = express();
const PORT = 8080;

console.log("🚀 Iniciando debug del servidor...");

// Manejadores de eventos de proceso
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('👋 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente!' });
});

const startServer = async () => {
  try {
    console.log("📡 Conectando a la base de datos...");
    await connectDB();
    console.log("✅ Conexión a DB exitosa");
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Servidor iniciado en puerto ${PORT}`);
      console.log(`🌐 Servidor accesible en http://localhost:${PORT}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Error en el servidor:', error);
    });
    
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();