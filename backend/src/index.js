import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { processPendingSales } from './services/pointsProcessor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.LIFF_APP_URL,
  process.env.ADMIN_PANEL_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (origin.endsWith('.pages.dev')) return callback(null, true);
    console.log('CORS blocked origin:', origin);
    callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

cron.schedule('0 1 * * *', async () => {
  console.log('Running scheduled points processing (T+1)...');
  try {
    await processPendingSales();
    console.log('Scheduled points processing completed');
  } catch (error) {
    console.error('Scheduled points processing failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 User API: http://localhost:${PORT}/api/user`);
  console.log(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`⏰ Cron job scheduled: Daily at 01:00 AM for T+1 processing`);
});

export default app;
