import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const SECRET_KEY = process.env.ADMIN_SECRET || 'cyber_aldy_secure_key_2026_x89a';
let inMemoryAdminPass = null;
let inMemoryAdminUser = null;

export function generateToken(username) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    user: username,
    role: 'Administrator',
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours validity
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyAdminToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Token otentikasi tidak ditemukan. Silakan login kembali.' };
  }

  const token = authHeader.split(' ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token otentikasi tidak valid.' };
  }

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Token otentikasi tidak valid atau telah dimodifikasi.' };
  }

  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decodedPayload.exp && decodedPayload.exp < Date.now()) {
      return { valid: false, error: 'Sesi token telah kadaluarsa. Silakan login sebagai admin kembali.' };
    }
    return { valid: true, user: decodedPayload };
  } catch (err) {
    return { valid: false, error: 'Gagal mendeskripsi payload token.' };
  }
}

async function getStoredCredentials() {
  let user = inMemoryAdminUser || process.env.ADMIN_USER || 'Aldyansyah';
  let pass = inMemoryAdminPass || process.env.ADMIN_PASS || 'admin123';

  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const sql = neon(databaseUrl);
      const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('admin_username', 'admin_password')`;
      rows.forEach(r => {
        if (r.key === 'admin_username' && r.value) {
          const val = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
          if (val.username) user = val.username;
        }
        if (r.key === 'admin_password' && r.value) {
          const val = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
          if (val.password) pass = val.password;
        }
      });
    } catch (e) {
      console.warn('Postgres credentials query warning:', e.message);
    }
  }
  return { user, pass };
}

async function setStoredPassword(newPassword, newUsername) {
  if (newPassword) inMemoryAdminPass = newPassword;
  if (newUsername) inMemoryAdminUser = newUsername;

  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const sql = neon(databaseUrl);
      if (newPassword) {
        await sql`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES ('admin_password', ${JSON.stringify({ password: newPassword })}::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
      }
      if (newUsername) {
        await sql`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES ('admin_username', ${JSON.stringify({ username: newUsername })}::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
      }
    } catch (e) {
      console.warn('Postgres credentials update warning:', e.message);
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, username, password, currentPassword, newPassword, newUsername } = req.body || {};
    const { user: validUser, pass: validPass } = await getStoredCredentials();

    // Action: Change Password / Username
    if (action === 'change_password') {
      const auth = verifyAdminToken(req);
      if (!auth.valid) {
        return res.status(401).json({ success: false, error: auth.error });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Password lama dan password baru wajib diisi.' });
      }

      if (currentPassword !== validPass) {
        return res.status(400).json({ success: false, error: 'Password lama yang Anda masukkan salah.' });
      }

      if (newPassword.length < 5) {
        return res.status(400).json({ success: false, error: 'Password baru minimal 5 karakter.' });
      }

      await setStoredPassword(newPassword, newUsername);
      return res.status(200).json({
        success: true,
        message: 'Kredensial admin berhasil diperbarui!'
      });
    }

    // Standard Login
    const inputUser = (username || '').trim().toLowerCase();
    const storedUser = validUser.trim().toLowerCase();
    const isUserMatch = (
      inputUser === storedUser ||
      inputUser === 'aldyansyah' ||
      inputUser === 'admin'
    );

    const isPassMatch = (password === validPass);

    if (isUserMatch && isPassMatch) {
      const token = generateToken(username || validUser);
      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        token,
        user: { name: 'Aldyansyah', role: 'Administrator' }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Username atau password salah.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}


