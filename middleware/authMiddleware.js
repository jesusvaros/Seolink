// Enhanced authentication middleware with proper token verification
import { parse } from 'cookie';

// Get admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export function isAuthenticated(req) {
  // Get the cookie from the request
  const cookies = parse(req.headers.cookie || '');
  const authToken = cookies.auth_token;
  
  // Check if the token exists
  if (!authToken) {
    return false;
  }
  
  try {
    // Decode the token (in our implementation, it's base64 encoded)
    const decodedToken = Buffer.from(authToken, 'base64').toString('utf-8');
    
    // The token format is "email:password"
    const [email, password] = decodedToken.split(':');
    
    // Verify that both email and password match the admin credentials from env
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log('Invalid credentials in token');
      return false;
    }
    
    // If we get here, the token is valid
    return true;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return false;
  }
}
