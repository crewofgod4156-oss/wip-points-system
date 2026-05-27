import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../models/User.js';

export const verifyLineToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: { access_token: token }
    });

    console.log('LINE token verification response:', {
      client_id: response.data.client_id,
      expected: process.env.LINE_CHANNEL_ID,
      match: String(response.data.client_id) === String(process.env.LINE_CHANNEL_ID)
    });

    if (!response.data.client_id || String(response.data.client_id) !== String(process.env.LINE_CHANNEL_ID)) {
      console.error('Channel ID mismatch:', {
        received: response.data.client_id,
        expected: process.env.LINE_CHANNEL_ID
      });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const profile = profileResponse.data;
    console.log('LINE profile retrieved:', { userId: profile.userId, displayName: profile.displayName });
    
    let user = await User.findByLineUserId(profile.userId);
    if (!user) {
      console.log('Creating new user:', profile.userId);
      user = await User.create({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      });
    }

    req.user = user;
    req.lineProfile = profile;
    next();
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message || error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Invalid admin token' });
  }
};

export const generateAdminToken = (adminData) => {
  return jwt.sign(
    { 
      id: adminData.id, 
      username: adminData.username, 
      role: 'admin' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
