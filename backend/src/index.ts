import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import testStripsRouter from './routes/testStrips.js'; // Assuming ES Modules
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ FIX: Point to the absolute path inside the Docker container
// This path is created by the volume mount in your docker-compose.yml
app.use('/uploads', express.static('/usr/src/app/uploads'));

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed' });
  }
});

app.use('/api/test-strips', testStripsRouter); // Standard practice to prefix with /api

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

// ✅ FIX: Export the app for Supertest to use
export default app;