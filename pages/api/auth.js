// Simple authentication API for admin access
import { serialize } from 'cookie';

// Get admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// JWT is not implemented here for simplicity, but would be recommended in production
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, action } = req.body;

  // Handle logout
  if (action === 'logout') {
    res.setHeader('Set-Cookie', [
      serialize('auth_token', '', {
        maxAge: -1,
        path: '/',
      }),
    ]);
    return res.status(200).json({ success: true });
  }

  // Handle login
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Simple authentication check
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate a simple token with email+password
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    
    // Set cookie with the token
    res.setHeader('Set-Cookie', [
      serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
        sameSite: 'strict',
      }),
    ]);
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(401).json({ error: 'Invalid email or password' });
}
