import { neon } from '@neondatabase/serverless';
import { verifyAdminToken } from './auth.js';

// In-memory demo fallback store for local dev when DB env is not connected yet
let demoBeritaStore = [
  {
    id: 1,
    title: 'Peluncuran Platform Portofolio Digital Cyber V2',
    category: 'Teknologi',
    date: '24 September 2026',
    content: 'Platform pemantauan dan portofolio berbasis animasi sekuensial canvas 60fps resmi dirilis dengan performa tinggi dan integrasi Vercel Blob.',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Integrasi Database Serverless & Vercel Blob Storage',
    category: 'Pengembangan Web',
    date: '24 September 2026',
    content: 'Fitur upload foto berita real-time langsung ke Vercel Blob storage terhubung secara aman via serverless API functions.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  // Initialize DB if environment variable is available
  let sql = null;
  if (databaseUrl) {
    try {
      sql = neon(databaseUrl);
      // Auto-create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS berita (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT DEFAULT 'Umum',
          date TEXT NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (err) {
      console.warn('Postgres connection warning, fallbacking to store:', err.message);
      sql = null;
    }
  }

  // GET: Fetch all news or single article by ID
  if (req.method === 'GET') {
    try {
      const id = req.query.id;
      if (id) {
        if (sql) {
          const rows = await sql`SELECT * FROM berita WHERE id = ${id}`;
          if (rows && rows.length > 0) {
            return res.status(200).json({ success: true, source: 'database', data: rows[0] });
          }
          return res.status(404).json({ success: false, error: 'Artikel berita tidak ditemukan.' });
        }
        const item = demoBeritaStore.find(b => String(b.id) === String(id));
        if (item) {
          return res.status(200).json({ success: true, source: 'demo', data: item });
        }
        return res.status(404).json({ success: false, error: 'Artikel berita tidak ditemukan.' });
      }

      if (sql) {
        const rows = await sql`SELECT * FROM berita ORDER BY id DESC`;
        return res.status(200).json({ success: true, source: 'database', data: rows });
      }
      return res.status(200).json({ success: true, source: 'demo', data: demoBeritaStore });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST: Add new article with uploaded image URL (Admin required)
  if (req.method === 'POST') {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    try {
      const { title, category, content, imageUrl } = req.body || {};

      if (!title || !content || !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Judul, isi berita, dan URL foto wajib diisi.'
        });
      }

      const today = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (sql) {
        const result = await sql`
          INSERT INTO berita (title, category, date, content, image_url)
          VALUES (${title}, ${category || 'Umum'}, ${today}, ${content}, ${imageUrl})
          RETURNING *
        `;
        return res.status(201).json({ success: true, data: result[0] });
      } else {
        const newArticle = {
          id: Date.now(),
          title,
          category: category || 'Umum',
          date: today,
          content,
          imageUrl,
          created_at: new Date().toISOString()
        };
        demoBeritaStore.unshift(newArticle);
        return res.status(201).json({ success: true, source: 'demo', data: newArticle });
      }
    } catch (error) {
      console.error('Error inserting news:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE: Remove news article by ID (Admin required)
  if (req.method === 'DELETE') {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID berita wajib diberikan.' });
      }

      if (sql) {
        await sql`DELETE FROM berita WHERE id = ${id}`;
      } else {
        demoBeritaStore = demoBeritaStore.filter(item => String(item.id) !== String(id));
      }

      return res.status(200).json({ success: true, message: 'Berita berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting news:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

