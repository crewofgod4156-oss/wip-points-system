import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processExcelFile, processCSVFile, deleteUploadedFile } from '../services/fileProcessor.js';
import { Sales } from '../models/Sales.js';
import { Reward } from '../models/Reward.js';
import { Redemption } from '../models/Redemption.js';
import { processPendingSales } from '../services/pointsProcessor.js';
import { generateAdminToken } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only XLSX, XLS, and CSV files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = generateAdminToken({ id: 1, username });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const uploadSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let result;
    if (ext === '.csv') {
      result = await processCSVFile(filePath);
    } else {
      result = await processExcelFile(filePath);
    }
    
    deleteUploadedFile(filePath);
    
    if (result.errors.length > 0 && result.salesData.length === 0) {
      return res.status(400).json({
        error: 'No valid data found in file',
        errors: result.errors
      });
    }
    
    const batchId = uuidv4();
    const savedRecords = await Sales.createBulk(result.salesData, batchId);
    
    res.json({
      success: true,
      message: `Uploaded ${savedRecords.length} sales records`,
      batchId,
      recordsProcessed: savedRecords.length,
      errors: result.errors
    });
  } catch (error) {
    console.error('Upload sales error:', error);
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

export const processPoints = async (req, res) => {
  try {
    const result = await processPendingSales();
    res.json({
      success: true,
      message: 'Points processing completed',
      ...result
    });
  } catch (error) {
    console.error('Process points error:', error);
    res.status(500).json({ error: 'Failed to process points' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { query: dbQuery } = await import('../config/database.js');
    const result = await dbQuery(
      `SELECT u.user_id, u.line_user_id, u.display_name, u.first_name, u.last_name, 
              u.phone_number, u.address, u.registered, u.created_at, u.updated_at,
              COALESCE(pb.total_points, 0) as total_points,
              COALESCE(pb.used_points, 0) as used_points,
              COALESCE(pb.available_points, 0) as available_points,
              (SELECT COUNT(*) FROM sales_records sr WHERE sr.phone_number = u.phone_number AND sr.processed = true) as total_sales,
              (SELECT COALESCE(SUM(sr.amount), 0) FROM sales_records sr WHERE sr.phone_number = u.phone_number AND sr.processed = true) as total_sales_amount
       FROM users u
       LEFT JOIN points_balance pb ON u.user_id = pb.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getSalesRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let sales;
    if (startDate && endDate) {
      sales = await Sales.getSalesByDateRange(startDate, endDate);
    } else {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      const defaultEnd = new Date();
      sales = await Sales.getSalesByDateRange(
        defaultStart.toISOString().split('T')[0],
        defaultEnd.toISOString().split('T')[0]
      );
    }
    
    res.json(sales);
  } catch (error) {
    console.error('Get sales records error:', error);
    res.status(500).json({ error: 'Failed to get sales records' });
  }
};

export const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.getAll(false);
    res.json(rewards);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to get rewards' });
  }
};

export const createReward = async (req, res) => {
  try {
    const { name, description, pointsRequired, stock, imageUrl } = req.body;
    
    if (!name || !pointsRequired) {
      return res.status(400).json({ error: 'Name and points required are mandatory' });
    }
    
    const reward = await Reward.create({
      name,
      description,
      pointsRequired,
      stock: stock || 0,
      imageUrl
    });
    
    res.json(reward);
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Failed to create reward' });
  }
};

export const updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const updates = req.body;
    
    const reward = await Reward.update(rewardId, updates);
    
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    res.json(reward);
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Failed to update reward' });
  }
};

export const deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    
    const reward = await Reward.delete(rewardId);
    
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    res.json({ message: 'Reward deleted successfully', reward });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ error: 'Failed to delete reward' });
  }
};

export const getRedemptions = async (req, res) => {
  try {
    const { status } = req.query;
    const redemptions = await Redemption.getAll(status);
    res.json(redemptions);
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Failed to get redemptions' });
  }
};

export const updateRedemptionStatus = async (req, res) => {
  try {
    const { redemptionId } = req.params;
    const { status, notes } = req.body;
    
    const redemption = await Redemption.updateStatus(redemptionId, status, notes);
    
    if (!redemption) {
      return res.status(404).json({ error: 'Redemption not found' });
    }
    
    res.json(redemption);
  } catch (error) {
    console.error('Update redemption status error:', error);
    res.status(500).json({ error: 'Failed to update redemption status' });
  }
};
