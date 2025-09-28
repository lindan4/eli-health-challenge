import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// Import jsQR with proper error handling
import jsQR from 'jsqr';

const router = Router();
const UPLOADS_DIR = 'uploads';
const FAILED_DIR = 'failed_qr_uploads';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ dest: path.join(UPLOADS_DIR, '/') });

// Ensure uploads directory exists
(async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
})();

(async () => {
  try {
    await fs.mkdir(FAILED_DIR, { recursive: true });
    console.log(`Directory '${FAILED_DIR}' is ready.`);
  } catch (error) {
    console.error('Error creating failed uploads directory:', error);
  }
})();

interface QRDecodeResult {
  data: string | null;
  approach: string | null;
  error?: string;
}

// Reliable QR code decoder using Sharp + jsQR with multiple preprocessing approaches
async function decodeQRFromBuffer(imageBuffer: Buffer): Promise<QRDecodeResult> {
  const approaches = [
    {
      name: 'original_rgba',
      process: () => sharp(imageBuffer)
        .rotate() // auto-rotate based on EXIF
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'grayscale_normalized',
      process: () => sharp(imageBuffer)
        .rotate()
        .grayscale()
        .normalize()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'high_contrast',
      process: () => sharp(imageBuffer)
        .rotate()
        .grayscale()
        .normalize()
        .linear(2.0, -100) // Increase contrast significantly
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'threshold_binary',
      process: () => sharp(imageBuffer)
        .rotate()
        .grayscale()
        .threshold(128) // Convert to pure black/white
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'upscaled_small_images',
      process: async () => {
        const metadata = await sharp(imageBuffer).metadata();
        let targetSize = 800;
        
        // If image is very small, upscale more aggressively
        if ((metadata.width && metadata.width < 400) || (metadata.height && metadata.height < 400)) {
          targetSize = 1200;
        }
        
        return sharp(imageBuffer)
          .rotate()
          .resize(targetSize, targetSize, { fit: 'inside' })
          .sharpen() // Add sharpening for upscaled images
          .grayscale()
          .normalize()
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
      }
    },
    
    {
      name: 'enhanced_edges',
      process: () => sharp(imageBuffer)
        .rotate()
        .grayscale()
        .sharpen(2.0) // Enhance edges
        .normalize()
        .linear(1.5, -50) // Moderate contrast boost
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'inverted_colors',
      process: () => sharp(imageBuffer)
        .rotate()
        .grayscale()
        .negate() // Invert colors
        .normalize()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    },
    
    {
      name: 'large_size_processing',
      process: () => sharp(imageBuffer)
        .rotate()
        .resize(1000, 1000, { fit: 'inside' })
        .grayscale()
        .normalize()
        .linear(1.2, -20)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    }
  ];

  for (const approach of approaches) {
    try {
      console.log(`Trying QR decode approach: ${approach.name}`);
      
      const { data, info } = await approach.process();
      console.log(`Processed image: ${info.width}x${info.height}, channels: ${info.channels}`);
      
      // Ensure we have RGBA data for jsQR
      let rgbaData: Uint8ClampedArray;
      
      if (info.channels === 4) {
        // Already RGBA
        rgbaData = new Uint8ClampedArray(data);
      } else if (info.channels === 3) {
        // RGB to RGBA
        rgbaData = new Uint8ClampedArray(info.width * info.height * 4);
        for (let i = 0; i < info.width * info.height; i++) {
          rgbaData[i * 4] = data[i * 3];         // R
          rgbaData[i * 4 + 1] = data[i * 3 + 1]; // G
          rgbaData[i * 4 + 2] = data[i * 3 + 2]; // B
          rgbaData[i * 4 + 3] = 255;             // A
        }
      } else if (info.channels === 1) {
        // Grayscale to RGBA
        rgbaData = new Uint8ClampedArray(info.width * info.height * 4);
        for (let i = 0; i < info.width * info.height; i++) {
          const gray = data[i];
          rgbaData[i * 4] = gray;     // R
          rgbaData[i * 4 + 1] = gray; // G
          rgbaData[i * 4 + 2] = gray; // B
          rgbaData[i * 4 + 3] = 255;  // A
        }
      } else {
        throw new Error(`Unsupported channel count: ${info.channels}`);
      }

      // Use jsQR to decode the QR code
      const result = jsQR.default(rgbaData, info.width, info.height, {
        inversionAttempts: 'attemptBoth' // Try both normal and inverted
      });

      if (result && result.data) {
        console.log(`✅ QR code found using approach: ${approach.name}`);
        console.log('QR Data:', result.data);
        return {
          data: result.data,
          approach: approach.name
        };
      } else {
        console.log(`❌ No QR code found with approach: ${approach.name}`);
      }

    } catch (err) {
      console.log(`❌ Approach ${approach.name} failed:`, err instanceof Error ? err.message : 'Unknown error');
      continue;
    }
  }

  return {
    data: null,
    approach: null,
    error: 'No QR code found with any approach'
  };
}

// Alternative function for base64 images
async function decodeQRFromBase64(base64String: string): Promise<QRDecodeResult> {
  try {
    const qrBuffer = Buffer.from(base64String.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    return await decodeQRFromBuffer(qrBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: null,
      approach: null,
      error: errorMessage
    };
  }
}

router.post('/upload', upload.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG and PNG are accepted.' });
    }

    const imageBuffer = await fs.readFile(file.path);
    console.log('Processing image:', file.originalname, 'Size:', file.size, 'bytes');
    
    // Get image metadata for debugging
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Original image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    // --- 1. Decode QR code using Sharp + jsQR ---
    const qrResult = await decodeQRFromBuffer(imageBuffer);
    
    let savedPath: string | null = null;

    if (!qrResult.data) {
      console.log('❌ No QR code found:', qrResult.error);
      
      // Save failed image for debugging
      const filename = `failed-${file.filename}${path.extname(file.originalname)}`;
      savedPath = path.join(FAILED_DIR, filename);
      await fs.writeFile(savedPath, imageBuffer);
      console.log('Saved failed QR image to:', savedPath);
    } else {
      console.log('✅ QR Code successfully decoded:', qrResult.data);
      
      // Test the regex pattern with your specific QR code
      const isValidFormat = /^ELI-\d{4}-\d{3}$/.test(qrResult.data);
      console.log(`QR code format validation: ${isValidFormat ? 'VALID' : 'INVALID'}`);
      
      if (isValidFormat) {
        // Extract year and check expiration
        const yearFromQr = parseInt(qrResult.data.substring(4, 8), 10);
        const currentYear = new Date().getFullYear();
        const isExpired = yearFromQr < currentYear;
        console.log(`Expiration check: ${isExpired ? 'EXPIRED' : 'VALID'} (Year: ${yearFromQr})`);
      }
    }

    // --- 2. Uncomment when ready to save to database ---
    const qrCodeValid = qrResult.data ? /^ELI-\d{4}-\d{3}$/.test(qrResult.data) : false;
    let isExpired = false;
    if (qrCodeValid && qrResult.data) {
      const yearFromQr = parseInt(qrResult.data.substring(4, 8), 10);
      const currentYear = new Date().getFullYear();
      if (yearFromQr < currentYear) isExpired = true;
    }

    let status = 'error';
    let quality = 'poor';
    let errorMessage = qrResult.error || 'QR code not found';
    
    if (qrResult.data) {
      if (qrCodeValid) {
        quality = 'good';
        status = isExpired ? 'expired' : 'processed';
        errorMessage = isExpired ? `Test strip expired in ${qrResult.data.substring(4, 8)}` : '';
      } else {
        quality = 'fair';
        errorMessage = 'Invalid QR code format';
      }
    }

    // Generate thumbnail using Sharp
    const thumbnailFilename = `thumb-${file.filename}.png`;
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailFilename);
    await sharp(imageBuffer).resize(200, 200).png().toFile(thumbnailPath);

    res.status(200).json({ 
      message: 'Image processed successfully',
      qrCode: qrResult.data,
      found: !!qrResult.data,
      approach: qrResult.approach,
      failedImageSaved: !!savedPath,
      error: qrResult.error,
      originalSize: `${metadata.width}x${metadata.height}`
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error processing image' });
  } finally {
    await fs.unlink(file.path).catch(e => console.error('Failed to delete temp file:', e));
  }
});

/**
 * @route   POST /api/test-strips/upload-base64
 * @desc    Upload and process QR code from base64 string
 * @access  Public
 */
router.post('/upload-base64', async (req, res) => {
  try {
    const { image: base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'No base64 image provided' });
    }

    console.log('Processing base64 image...');

    const qrResult = await decodeQRFromBase64(base64Image);

    res.status(200).json({
      message: 'Base64 image processed successfully',
      qrCode: qrResult.data,
      found: !!qrResult.data,
      approach: qrResult.approach,
      error: qrResult.error
    });

  } catch (err) {
    console.error('Unexpected error processing base64:', err);
    res.status(500).json({ error: 'Unexpected error processing base64 image' });
  }
});

/**
 * @route   GET /api/test-strips
 * @desc    Get a paginated list of all submissions
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const submissionsResult = await pool.query(
            `SELECT
               id,
               qr_code AS "qrCode",
               status,
               quality,
               thumbnail_path AS "thumbnailUrl",
               created_at AS "createdAt"
             FROM test_strip_submissions
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM test_strip_submissions');
        const total = parseInt(countResult.rows[0].count, 10);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            submissions: submissionsResult.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

/**
 * @route   GET /api/test-strips/:id
 * @desc    Get a single submission by its ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM test_strip_submissions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

export default router;