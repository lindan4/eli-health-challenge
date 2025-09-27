import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import jsQR from 'jsqr';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure multer storage
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Read image for QR detection
    const imageBuffer = fs.readFileSync(file.path);
    // TODO: Convert to pixel data for jsQR
    // Convert to raw pixel data (grayscale)
    const { data, info } = await sharp(imageBuffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

    // jsQR needs Uint8ClampedArray
    const clamped = new Uint8ClampedArray(data);

    // Now detect QR code
    const qr = jsQR.default(clamped, info.width, info.height);
    
    const qrCode = qr ? qr.data : null;
    const qrCodeValid = qrCode ? /^ELI-\d{4}-\d{3}$/.test(qrCode) : false;
    const status = qrCodeValid ? 'valid' : 'invalid';

    // Generate thumbnail
    const thumbnailPath = `uploads/thumb-${file.filename}.png`;
    await sharp(file.path).resize(200, 200).toFile(thumbnailPath);

    // Store in DB
    const result = await pool.query(
      `INSERT INTO test_strip_submissions 
      (qr_code, original_image_path, thumbnail_path, status)
      VALUES ($1, $2, $3, $4) RETURNING *`,
      [qrCode, file.path, thumbnailPath, status]
    );

    res.json({ success: true, submission: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process image', details: err });
  }
});

router.get('/', async (req, res) => {
  try {
    // Pagination params (defaults)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
         id, qr_code AS "qrCode", status, 
         -- Assuming quality is a column; else placeholder
         COALESCE(quality, 'unknown') AS quality, 
         thumbnail_path AS "thumbnailUrl", 
         created_at AS "createdAt"
       FROM test_strip_submissions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Count total for pagination metadata
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM test_strip_submissions'
    );
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      page,
      limit,
      total,
      submissions: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err });
  }
});

// GET /api/test-strips/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
         id, 
         qr_code AS "qrCode",
         original_image_path AS "originalImagePath",
         thumbnail_path AS "thumbnailUrl",
         status,
         COALESCE(quality, 'unknown') AS quality,
         image_size AS "imageSize",
         image_dimensions AS "imageDimensions",
         error_message AS "errorMessage",
         created_at AS "createdAt"
       FROM test_strip_submissions
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submission', details: err });
  }
});

export default router;