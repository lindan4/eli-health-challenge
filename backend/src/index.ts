import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import testStripsRouter from './routes/testStrips.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed', details: err });
  }
});

app.use('/test-strips', testStripsRouter);

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
}); 