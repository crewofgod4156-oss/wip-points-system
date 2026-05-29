import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import {
  adminLogin,
  uploadSales,
  upload,
  processPoints,
  getPendingSalesPreview,
  deleteSalesBatch,
  getSalesRecords,
  getAllUsers,
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  getRedemptions,
  updateRedemptionStatus
} from '../controllers/adminController.js';

const router = express.Router();

router.post('/login', adminLogin);

router.use(adminAuth);

router.post('/upload-sales', upload.single('file'), uploadSales);
router.post('/process-points', processPoints);
router.get('/sales', getSalesRecords);
router.get('/sales/pending-preview', getPendingSalesPreview);
router.delete('/sales/batch/:batchId', deleteSalesBatch);
router.get('/users', getAllUsers);
router.get('/rewards', getRewards);
router.post('/rewards', createReward);
router.put('/rewards/:rewardId', updateReward);
router.delete('/rewards/:rewardId', deleteReward);
router.get('/redemptions', getRedemptions);
router.put('/redemptions/:redemptionId', updateRedemptionStatus);

export default router;
