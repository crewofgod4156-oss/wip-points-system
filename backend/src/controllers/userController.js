import { Points } from '../models/Points.js';
import { Reward } from '../models/Reward.js';
import { Redemption } from '../models/Redemption.js';
import { Sales } from '../models/Sales.js';
import { User } from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const balance = await Points.getBalance(user.user_id);
    
    res.json({
      user: {
        userId: user.user_id,
        lineUserId: user.line_user_id,
        displayName: user.display_name,
        pictureUrl: user.picture_url,
        phoneNumber: user.phone_number || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        address: user.address || null,
        registered: user.registered || false
      },
      points: balance
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const getPoints = async (req, res) => {
  try {
    const balance = await Points.getBalance(req.user.user_id);
    res.json(balance);
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Failed to get points' });
  }
};

export const getPointsHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await Points.getTransactionHistory(req.user.user_id, limit, offset);
    res.json(history);
  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({ error: 'Failed to get points history' });
  }
};

export const getSalesHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sales = await Sales.getUserSales(req.user.user_id, limit);
    res.json(sales);
  } catch (error) {
    console.error('Get sales history error:', error);
    res.status(500).json({ error: 'Failed to get sales history' });
  }
};

export const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.getAll(true);
    res.json(rewards);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to get rewards' });
  }
};

export const redeemReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    
    if (!rewardId) {
      return res.status(400).json({ error: 'Reward ID is required' });
    }
    
    const redemption = await Redemption.create(req.user.user_id, rewardId);
    const redemptionDetails = await Redemption.getById(redemption.redemption_id);
    
    // Send LINE notifications (non-blocking)
    const { notifyAdminRedemption, notifyUserRedemptionSuccess } = await import('../services/lineNotify.js');
    notifyAdminRedemption(redemptionDetails).catch(err => 
      console.error('Failed to send admin notification:', err)
    );
    notifyUserRedemptionSuccess(req.user.line_user_id, redemptionDetails).catch(err => 
      console.error('Failed to send user notification:', err)
    );
    
    res.json({
      success: true,
      redemption: redemptionDetails,
      redemption_code: redemptionDetails.redemption_code
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, address, phoneNumber } = req.body;
    
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกนามสกุล' });
    }
    if (!phoneNumber) {
      return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์' });
    }
    
    const normalized = phoneNumber.replace(/[^0-9]/g, '');
    if (!/^0\d{8,9}$/.test(normalized)) {
      return res.status(400).json({ error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)' });
    }
    
    const existing = await User.findByPhoneNumber(normalized);
    if (existing && existing.line_user_id !== req.user.line_user_id) {
      return res.status(409).json({ error: 'เบอร์โทรนี้ถูกใช้งานแล้ว' });
    }
    
    const updatedUser = await User.register(req.user.line_user_id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address ? address.trim() : null,
      phoneNumber: normalized
    });
    
    res.json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      user: {
        userId: updatedUser.user_id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        address: updatedUser.address,
        phoneNumber: updatedUser.phone_number,
        registered: updatedUser.registered
      }
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ error: 'ไม่สามารถลงทะเบียนได้' });
  }
};

export const updatePhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์' });
    }
    
    const normalized = phoneNumber.replace(/[^0-9]/g, '');
    if (!/^0\d{8,9}$/.test(normalized)) {
      return res.status(400).json({ error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)' });
    }
    
    const existing = await User.findByPhoneNumber(normalized);
    if (existing && existing.line_user_id !== req.user.line_user_id) {
      return res.status(409).json({ error: 'เบอร์โทรนี้ถูกใช้งานแล้ว' });
    }
    
    const updatedUser = await User.updatePhoneNumber(req.user.line_user_id, normalized);
    
    res.json({
      success: true,
      message: 'ผูกเบอร์โทรศัพท์สำเร็จ',
      phoneNumber: updatedUser.phone_number
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกเบอร์โทรศัพท์ได้' });
  }
};

export const getRedemptions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const redemptions = await Redemption.getUserRedemptions(req.user.user_id, limit);
    res.json(redemptions);
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Failed to get redemptions' });
  }
};
