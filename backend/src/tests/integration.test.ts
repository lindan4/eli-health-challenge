import request from 'supertest';
import path from 'path';
import app from '../index.js';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

describe('Full Upload Integration Test', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('should handle complete upload flow from image to database', async () => {
    const imagePath = path.resolve(__dirname, '__fixtures__/valid-1.jpg');

    // 1. Upload the image
    const uploadResponse = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', imagePath);

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.id).toBeDefined();
    const submissionId = uploadResponse.body.id;

    // 2. Verify it appears in the list
    const listResponse = await request(app)
      .get('/api/test-strips')
      .query({ page: 1, limit: 10 });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.submissions).toBeDefined();
    const found = listResponse.body.submissions.find(
      (s: any) => s.id === submissionId
    );
    expect(found).toBeDefined();
    expect(found.qrCode).toBe('ELI-2025-001');

    // 3. Fetch the specific submission
    const detailResponse = await request(app)
      .get(`/api/test-strips/${submissionId}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(submissionId);
    expect(detailResponse.body.status).toBe('processed');

    // 4. Verify database record
    const dbResult = await pool.query(
      'SELECT * FROM test_strip_submissions WHERE id = $1',
      [submissionId]
    );
    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].qr_code).toBe('ELI-2025-001');
  });
});