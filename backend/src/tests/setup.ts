// backend/src/__tests__/setup.ts
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs/promises';


// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

beforeAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Read the schema file
    const schema = await fs.readFile(path.join(__dirname, '../../db/schema.sql'), 'utf-8');
    
    // Drop the table if it exists to ensure a clean state
    await pool.query('DROP TABLE IF EXISTS test_strip_submissions;');
    
    // Apply the schema
    await pool.query(schema);
    
    console.log('Test database schema applied successfully.');
  } catch (error) {
    console.error('Failed to apply test database schema:', error);
    process.exit(1); // Exit if setup fails
  } finally {
    await pool.end();
  }
});