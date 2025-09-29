import request from 'supertest';
import path from 'path';
import app from '../index.js'; 

// Mock the pool query to avoid actual DB operations in unit tests if desired
// For this integration test, we'll let it hit the DB.

describe('POST /api/test-strips/upload', () => {
  // Test the "happy path" with a valid QR code
  it('should process a valid test strip and return status "processed"', async () => {
    // Assuming 'valid-1.jpg' contains the QR code 'ELI-2025-001'
    const imagePath = path.resolve(__dirname, '__fixtures__/valid-1.jpg');

    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', imagePath);

    // ✅ FIX: Your code returns 200 OK on success now
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('processed');
    expect(response.body.qrCode).toBe('ELI-2025-001');
    expect(response.body.qrCodeValid).toBe(true);
  });

  // Test the expiration business rule
  it('should process an expired test strip and return status "expired"', async () => {
    // ✅ FIX: Ensure you're using a fixture image that contains 'ELI-2024-999'
    const imagePath = path.resolve(__dirname, '__fixtures__/expired-1.jpg');

    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', imagePath);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('expired');
    expect(response.body.qrCode).toBe('ELI-2024-999');
  });

  // Test the primary error case
  it('should process an image with no QR code and return status "error"', async () => {
    const imagePath = path.resolve(__dirname, '__fixtures__/invalid-1.jpg');

    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', imagePath);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('error');
    expect(response.body.qrCode).toBeNull();
    expect(response.body.qrCodeValid).toBe(false);
  });
});