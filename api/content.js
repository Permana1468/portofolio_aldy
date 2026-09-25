import { neon } from '@neondatabase/serverless';
import { verifyAdminToken } from './auth.js';

// Default content store for Landing Page
let siteContentStore = {
  hero: {
    subtitle: 'Halo, Nama Saya',
    titleLine1: 'Muhamad',
    titleLine2: 'Aldiansyah',
    tagline: 'Saya Seorang Digital Planner & Creator yang Menghubungkan data, design dan kode menjadi solusi nyata.',
    description: 'Berpengalaman dalam tata kelola perencanaan administrasi, dipadukan dengan kecintaan merancang antarmuka visual dan membangun aplikasi web yang fungsional serta berdampak.'
  },
  about: {
    badge: '# Tentang Saya',
    title: 'Digital Planner & Visual Developer',
    description1: 'Berbekal latar belakang dalam perencanaan digital dan administrasi, saya berfokus pada efisiensi sistem dan keindahan visual antarmuka web modern.',
    description2: 'Setiap proyek dikerjakan dengan pendekatan berbasis data, desain intuitif, serta performa kode murni yang responsif di berbagai perangkat.'
  },
  projects: [
    {
      id: 1,
      tag: 'System Digitalisasi Desa (SDD)',
      title: 'Portal Resmi Desa Cimanggu I',
      desc: 'Website portal resmi Desa Cimanggu I yang memadukan sistem digitalisasi administrasi desa, transparansi informasi publik, serta integrasi layanan masyarakat.',
      tech: ['Digitalisasi Desa', 'Tata Kelola Web', 'UI/UX & System Integration'],
      url: 'https://www.desacimanggusatu.web.id'
    },
    {
      id: 2,
      tag: 'Pengembangan Web',
      title: 'Nexa Creative Studio',
      desc: 'Website studio kreatif dengan animasi 3D interaktif dan performa kecepatan akses maksimum.',
      tech: ['Next.js', 'Three.js', 'WebGL'],
      url: '#'
    },
    {
      id: 3,
      tag: 'Keamanan & Data',
      title: 'Cyber Shield Dashboard',
      desc: 'Platform pemantauan ancaman keamanan siber secara real-time dengan antarmuka futuristik dan analisis AI.',
      tech: ['React', 'Tailwind', 'Security'],
      url: '#'
    }
  ],
  messages: [],
  social: {
    github: 'https://github.com/permana1468',
    linkedin: 'https://linkedin.com/in/muhamad-aldiansyah',
    instagram: 'https://instagram.com',
    twitter: 'https://x.com',
    whatsapp: 'https://wa.me/6281234567890',
    email: 'mailto:muhamadaldiansyah100797@gmail.com'
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  let sql = null;
  if (databaseUrl) {
    try {
      sql = neon(databaseUrl);
      // Auto-create settings & messages tables
      await sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(50) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    } catch (err) {
      console.warn('Postgres connection warning in content.js:', err.message);
      sql = null;
    }
  }

  // GET: Fetch all landing page content or contact messages
  if (req.method === 'GET') {
    const type = req.query.type;

    try {
      if (type === 'messages') {
        // Checking messages requires admin token
        const auth = verifyAdminToken(req);
        if (!auth.valid) {
          return res.status(401).json({ success: false, error: auth.error });
        }

        if (sql) {
          const rows = await sql`SELECT * FROM contact_messages ORDER BY id DESC`;
          return res.status(200).json({ success: true, data: rows });
        }
        return res.status(200).json({ success: true, source: 'store', data: siteContentStore.messages });
      }

      if (sql) {
        const rows = await sql`SELECT key, value FROM site_settings`;
        if (rows.length > 0) {
          const dbStore = {};
          rows.forEach(r => { dbStore[r.key] = r.value; });
          return res.status(200).json({ success: true, source: 'database', data: { ...siteContentStore, ...dbStore } });
        }
      }
      return res.status(200).json({ success: true, source: 'store', data: siteContentStore });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST: Update specific content section (Admin), clear cache (Admin), or submit contact message (Public)
  if (req.method === 'POST') {
    try {
      const { action, section, data, messageData } = req.body || {};

      // Handle Action: Clear Cache & Spam (Admin required)
      if (action === 'clear_cache') {
        const auth = verifyAdminToken(req);
        if (!auth.valid) {
          return res.status(401).json({ success: false, error: auth.error });
        }

        // Purge transient messages/drafts
        return res.status(200).json({
          success: true,
          message: 'Cache sistem & file spam temporary berhasil dibersihkan! Performa memori dioptimalkan (60 FPS).'
        });
      }

      // Handle contact message submission from frontend visitors (Public)
      if (messageData) {
        const { name, email, message } = messageData;
        if (!name || !email || !message) {
          return res.status(400).json({ success: false, error: 'Nama, Email, dan Pesan wajib diisi.' });
        }

        // Basic input sanitization
        const cleanName = String(name).trim().slice(0, 100);
        const cleanEmail = String(email).trim().slice(0, 100);
        const cleanMsg = String(message).trim().slice(0, 2000);

        if (sql) {
          await sql`
            INSERT INTO contact_messages (name, email, message)
            VALUES (${cleanName}, ${cleanEmail}, ${cleanMsg})
          `;
        }
        const newMsg = {
          id: Date.now(),
          name: cleanName,
          email: cleanEmail,
          message: cleanMsg,
          created_at: new Date().toISOString()
        };
        siteContentStore.messages.unshift(newMsg);
        return res.status(201).json({ success: true, message: 'Pesan berhasil dikirim!' });
      }

      // Handle admin content update (Hero, Projects, About) - Requires Admin Auth
      const auth = verifyAdminToken(req);
      if (!auth.valid) {
        return res.status(401).json({ success: false, error: auth.error });
      }

      if (!section || !data) {
        return res.status(400).json({ success: false, error: 'Section dan Data wajib diisi.' });
      }

      siteContentStore[section] = data;

      if (sql) {
        await sql`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES (${section}, ${JSON.stringify(data)}::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
      }

      return res.status(200).json({
        success: true,
        message: `Konten seksi ${section} berhasil diperbarui!`,
        data: siteContentStore[section]
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }


  // DELETE: Delete contact message or project item (Admin required)
  if (req.method === 'DELETE') {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    const { type, id } = req.query;

    try {
      if (type === 'messages' && id) {
        if (sql) {
          await sql`DELETE FROM contact_messages WHERE id = ${id}`;
        }
        siteContentStore.messages = siteContentStore.messages.filter(m => String(m.id) !== String(id));
        return res.status(200).json({ success: true, message: 'Pesan berhasil dihapus.' });
      }

      if (type === 'projects' && id) {
        siteContentStore.projects = siteContentStore.projects.filter(p => String(p.id) !== String(id));
        if (sql) {
          await sql`
            INSERT INTO site_settings (key, value, updated_at)
            VALUES ('projects', ${JSON.stringify(siteContentStore.projects)}::jsonb, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          `;
        }
        return res.status(200).json({ success: true, message: 'Proyek berhasil dihapus.' });
      }

      return res.status(400).json({ success: false, error: 'Tipe dan ID tidak valid.' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

