import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.routes.js';
import { productRoutes } from './routes/product.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import posRoutes from './routes/pos.routes.js';
import { exchangeRoutes } from './routes/exchange.routes.js';
import { config } from './config/index.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow Vite dev server
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/exchanges', exchangeRoutes);

console.log('📊 POS API: http://localhost:4000/api/pos');
console.log('🏷️ Barcode API: http://localhost:4000/api/barcodes');
console.log('🔄 Exchange API: http://localhost:4000/api/exchanges');

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Test route (protected example)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Auth API: http://localhost:${port}/api/auth`);
  console.log(`📦 Products API: http://localhost:${port}/api/products`);
});