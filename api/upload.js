import { put } from '@vercel/blob';
import { verifyAdminToken } from './auth.js';

export default async function handler(req, res) {
  // Security Headers & CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin authentication check
  const auth = verifyAdminToken(req);
  if (!auth.valid) {
    return res.status(401).json({ success: false, error: auth.error });
  }

  try {
    const rawFilename = (req.query.filename || `image-${Date.now()}.jpg`).toString();
    // Sanitize filename: remove directory traversal attempts
    const sanitizedFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Restrict allowed file extensions for security
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (!allowedExtensions.test(sanitizedFilename)) {
      return res.status(400).json({
        success: false,
        error: 'Tipe file tidak diizinkan. Hanya gambar (jpg, png, webp, gif, svg) yang diperbolehkan.'
      });
    }
    
    // Check if BLOB token exists in environment
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN belum dikonfigurasi di Vercel/environment.'
      });
    }

    const blob = await put(sanitizedFilename, req, {
      access: 'public',
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname
    });
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    return res.status(500).json({ error: error.message || 'Upload gagal' });
  }
}

