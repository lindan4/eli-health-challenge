import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import jsQR from 'jsqr';

const router = Router();
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/usr/src/app/uploads';

console.log('Using uploads directory:', UPLOADS_DIR);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ dest: path.join(UPLOADS_DIR, '/') });

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
        const metadata: sharp.Metadata = await sharp(imageBuffer).metadata();
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
      // @ts-ignore: jsQR type mismatch workaround
      const result = jsQR(rgbaData, info.width, info.height, {
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

// Helper function to assess image quality
function assessImageQuality(metadata: sharp.Metadata, fileSize: number): 'good' | 'fair' | 'poor' {
  const { width = 0, height = 0 } = metadata;
  
  // Basic quality assessment based on resolution and file size
  const totalPixels = width * height;
  const bytesPerPixel = fileSize / totalPixels;
  
  // Good quality: High resolution, adequate file size
  if (totalPixels >= 1000000 && bytesPerPixel > 0.5) { // 1MP+, not over-compressed
    return 'good';
  }
  
  // Fair quality: Medium resolution OR adequate size but lower res
  if (totalPixels >= 500000 || bytesPerPixel > 0.3) { // 0.5MP+ OR not heavily compressed
    return 'fair';
  }
  
  // Poor quality: Low resolution and/or heavily compressed
  return 'poor';
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
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Original image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    // --- 1. Assess image quality (separate from QR code processing) ---
    const imageQuality = assessImageQuality(metadata, file.size);

    // --- 2. Decode QR code using Sharp + jsQR ---
    const qrResult = await decodeQRFromBuffer(imageBuffer);
    
    // --- 3. Prepare file paths ---
    const imageFilename = `${Date.now()}-${file.filename}${path.extname(file.originalname)}`;
    const imagePath = path.join(UPLOADS_DIR, imageFilename);
    const thumbnailFilename = `thumb-${Date.now()}-${file.filename}.png`;
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailFilename);

    // --- 4. Process QR code and determine status ---
    const qrCodeValid = qrResult.data ? /^ELI-\d{4}-\d{3}$/.test(qrResult.data) : false;
    let isExpired = false;
    let status = 'error';
    let errorMessage = '';

    if (!qrResult.data) {
      console.log('❌ No QR code found:', qrResult.error);
      status = 'error';
      errorMessage = 'No QR code detected in image';
    } else {
      console.log('✅ QR Code successfully decoded:', qrResult.data);
      
      if (qrCodeValid) {
        // Extract year and check expiration
        const yearFromQr = parseInt(qrResult.data.substring(4, 8), 10);
        const currentYear = new Date().getFullYear();
        isExpired = yearFromQr < currentYear;
        
        console.log(`Expiration check: ${isExpired ? 'EXPIRED' : 'VALID'} (Year: ${yearFromQr})`);
        
        if (isExpired) {
          status = 'expired';
          errorMessage = `Test strip expired in ${yearFromQr}`;
        } else {
          status = 'processed';
          errorMessage = '';
        }
      } else {
        console.log('❌ Invalid QR code format:', qrResult.data);
        status = 'error';
        errorMessage = 'Invalid QR code format';
      }
    }

    // --- 5. Save original image ---
    await fs.writeFile(imagePath, imageBuffer);
    console.log('Saved original image to:', imagePath);

    // --- 6. Generate and save thumbnail ---
    await sharp(imageBuffer).resize(200, 200).png().toFile(thumbnailPath);
    console.log('Generated thumbnail:', thumbnailPath);

    // --- 7. Save to database (CRITICAL: ALL submissions must be stored) ---
    const insertQuery = `
      INSERT INTO test_strip_submissions (
        qr_code, 
        original_image_path, 
        thumbnail_path, 
        image_size, 
        image_dimensions, 
        status, 
        error_message, 
        quality, 
        qr_code_valid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      qrResult.data || null,                              // qr_code
      imagePath,                                          // original_image_path  
      thumbnailPath,                                      // thumbnail_path
      file.size,                                          // image_size
      `${metadata.width}x${metadata.height}`,            // image_dimensions
      status,                                             // status
      errorMessage || null,                               // error_message
      imageQuality,                                       // quality (based on image characteristics)
      qrCodeValid                                         // qr_code_valid
    ];

    const result = await pool.query(insertQuery, values);
    const savedSubmission = result.rows[0];

    console.log('✅ Submission saved to database:', savedSubmission.id);

    // --- 9. Return response matching the required API format ---
    res.status(200).json({
      id: savedSubmission.id,
      status: savedSubmission.status,
      qrCode: savedSubmission.qr_code,
      qrCodeValid: savedSubmission.qr_code_valid,
      quality: savedSubmission.quality,
      processedAt: savedSubmission.created_at,
      // Additional debug info (can be removed in production)
      thumbnailUrl: thumbnailFilename,
      message: 'Image processed and saved successfully',
      found: !!qrResult.data,
      approach: qrResult.approach,
      originalSize: `${metadata.width}x${metadata.height}`
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error processing image' });
  } finally {
    // Clean up temp file
    await fs.unlink(file.path).catch(e => console.error('Failed to delete temp file:', e));
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

        // Extract filename from full path for each submission
        const submissions = submissionsResult.rows.map(row => ({
            ...row,
            thumbnailUrl: row.thumbnailUrl ? path.basename(row.thumbnailUrl) : null
        }));

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            submissions, // Use the mapped submissions with just filenames
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