import request from 'supertest';
import path from 'path';
import app from '../index.js'; 
import fs from 'fs/promises';


describe('POST /api/test-strips/upload', () => {
  // Test the "happy path" with a valid QR code
  it('should process a valid test strip and return status "processed"', async () => {
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

describe('Error Handling', () => {
  it('should reject files that are too large', async () => {
    const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB
    
    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', largeBuffer, 'large.jpg');

    expect(response.status).toBe(413);
    expect(response.body.error).toContain('File too large');
  });

  it('should reject invalid file types', async () => {
    const txtPath = path.resolve(__dirname, '__fixtures__/test.txt');
    await fs.writeFile(txtPath, 'not an image');

    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', txtPath);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file type');
    
    await fs.unlink(txtPath);
  });

  it('should handle malformed image data gracefully', async () => {
    const badImagePath = path.resolve(__dirname, '__fixtures__/corrupt.jpg');
    await fs.writeFile(badImagePath, 'fake jpeg data');

    const response = await request(app)
      .post('/api/test-strips/upload')
      .attach('image', badImagePath);

    // Sharp will fail on the corrupt image, returning 500
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Unexpected error processing image');
    
    await fs.unlink(badImagePath);
  });
});