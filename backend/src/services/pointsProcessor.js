import { Sales } from '../models/Sales.js';
import { Points } from '../models/Points.js';
import { User } from '../models/User.js';

const POINTS_RATE = parseInt(process.env.POINTS_RATE || '100');

export const calculatePoints = (amount) => {
  return Math.floor(amount / POINTS_RATE);
};

export const processPendingSales = async () => {
  console.log('Starting T+1 points processing...');
  
  try {
    const pendingRecords = await Sales.getPendingRecords();
    console.log(`Found ${pendingRecords.length} pending sales records`);
    
    if (pendingRecords.length === 0) {
      return { processed: 0, skipped: 0, errors: [] };
    }
    
    const userSalesMap = new Map();
    const skippedRecords = [];
    
    pendingRecords.forEach(record => {
      if (!record.user_id) {
        skippedRecords.push({
          recordId: record.record_id,
          lineUserId: record.line_user_id,
          reason: 'User not found in system'
        });
        return;
      }
      
      if (!userSalesMap.has(record.user_id)) {
        userSalesMap.set(record.user_id, {
          userId: record.user_id,
          totalAmount: 0,
          recordIds: []
        });
      }
      
      const userSales = userSalesMap.get(record.user_id);
      userSales.totalAmount += parseFloat(record.amount);
      userSales.recordIds.push(record.record_id);
    });
    
    const results = {
      processed: 0,
      skipped: skippedRecords.length,
      errors: []
    };
    
    for (const [userId, salesData] of userSalesMap) {
      try {
        const pointsEarned = calculatePoints(salesData.totalAmount);
        
        if (pointsEarned > 0) {
          await Points.addPoints(
            userId,
            pointsEarned,
            `Points from sales (${salesData.totalAmount.toFixed(2)} THB)`,
            `batch_${new Date().toISOString()}`
          );
        }
        
        await Sales.markAsProcessed(salesData.recordIds, pointsEarned);
        results.processed += salesData.recordIds.length;
        
        console.log(`Processed ${salesData.recordIds.length} records for user ${userId}, awarded ${pointsEarned} points`);
      } catch (error) {
        console.error(`Error processing sales for user ${userId}:`, error);
        results.errors.push({
          userId,
          error: error.message
        });
      }
    }
    
    console.log('Points processing completed:', results);
    return results;
  } catch (error) {
    console.error('Error in processPendingSales:', error);
    throw error;
  }
};

export const processUserSales = async (lineUserId, amount, saleDate) => {
  const user = await User.findByLineUserId(lineUserId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  const pointsEarned = calculatePoints(amount);
  
  await Points.addPoints(
    user.user_id,
    pointsEarned,
    `Points from sale on ${saleDate}`,
    `sale_${saleDate}`
  );
  
  return { success: true, pointsEarned };
};
