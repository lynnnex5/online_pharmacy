
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import prisma from './utils/prisma.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'PharmTech API Running...' });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      message: 'Database connection successful!',
    });
  } catch (error) {
    console.error('Database error:', error);

    res.status(500).json({
      message: 'Database connection failed.',
    });
  }
});

// Authentication routes
app.use('/api/auth', authRoutes);

async function startServer() {
  try {
    await prisma.$connect();

    console.log('Connected to Neon database successfully.');

    app.listen(PORT, () => {
      console.log(`PharmTech server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();
