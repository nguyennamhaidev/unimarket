const path = require('path');
const fs = require('fs');

/**
 * Storage Service for UniMarket
 * 
 * Supports:
 * 1. Supabase Storage (if SUPABASE_URL and SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY are set)
 * 2. Cloudinary (if CLOUDINARY_CLOUD_NAME & CLOUDINARY_UPLOAD_PRESET are set)
 * 3. Base64 Persistent Data URI (guaranteed zero-loss on Render ephemeral disks without extra setup)
 * 4. Local disk fallback for local development
 */

const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xyzcompany.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'unimarket-images';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload single image buffer to persistent storage
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - e.g. image/jpeg, image/png, image/webp
 * @returns {Promise<string>} Public persistent URL of the uploaded image
 */
async function uploadImageToStorage(buffer, originalName, mimeType) {
  const extension = path.extname(originalName) || '.jpg';
  const uniqueFilename = `unimarket-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

  // Strategy 1: Supabase Storage REST API (No heavy SDK required)
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const cleanUrl = SUPABASE_URL.replace(/\/+$/, '');
      const uploadEndpoint = `${cleanUrl}/storage/v1/object/${SUPABASE_BUCKET}/${uniqueFilename}`;

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': mimeType,
          'x-upsert': 'true'
        },
        body: buffer
      });

      if (response.ok) {
        const publicUrl = `${cleanUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${uniqueFilename}`;
        console.log(`[Storage] Uploaded to Supabase Storage: ${publicUrl}`);
        return publicUrl;
      } else {
        const errText = await response.text();
        console.error('[Storage] Supabase upload failed:', errText);
      }
    } catch (err) {
      console.error('[Storage] Supabase error, falling back:', err.message);
    }
  }

  // Strategy 2: Cloudinary REST Upload (if configured)
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
    try {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      formData.append('file', blob, uniqueFilename);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Storage] Uploaded to Cloudinary: ${data.secure_url}`);
        return data.secure_url;
      } else {
        const errText = await response.text();
        console.error('[Storage] Cloudinary upload failed:', errText);
      }
    } catch (err) {
      console.error('[Storage] Cloudinary error, falling back:', err.message);
    }
  }

  // Strategy 3: Guaranteed Persistent Data URI
  // Stored directly in the database as a standard Data URI.
  // This guarantees 100% image persistence on Render across all restarts and accounts, even with 0 cloud credentials!
  try {
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
    console.log(`[Storage] Stored as persistent Data URI (${Math.round(buffer.length / 1024)} KB)`);
    return dataUri;
  } catch (err) {
    console.error('[Storage] Data URI encoding error:', err);
  }

  // Strategy 4: Local filesystem upload fallback (for local development only)
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${uniqueFilename}`;
  } catch (err) {
    console.error('[Storage] Local filesystem write error:', err);
    throw new Error('Không thể lưu trữ hình ảnh.');
  }
}

module.exports = {
  uploadImageToStorage
};
