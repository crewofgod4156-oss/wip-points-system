import { query } from '../config/database.js';

export const Sales = {
  async createBulk(salesData, batchId) {
    const values = salesData.map((sale, index) => 
      `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
    ).join(',');
    
    const params = salesData.flatMap(sale => [
      sale.lineUserId || null,
      sale.phoneNumber || null,
      sale.customerName || null,
      sale.customerAddress || null,
      sale.saleDate,
      sale.amount,
      batchId
    ]);
    
    const result = await query(
      `INSERT INTO sales_records (line_user_id, phone_number, customer_name, customer_address, sale_date, amount, upload_batch_id)
       VALUES ${values}
       RETURNING *`,
      params
    );
    
    return result.rows;
  },

  async getPendingRecords() {
    const result = await query(
      `SELECT sr.*, 
              COALESCE(u1.user_id, u2.user_id) as user_id
       FROM sales_records sr
       LEFT JOIN users u1 ON sr.line_user_id = u1.line_user_id AND sr.line_user_id IS NOT NULL AND sr.line_user_id != ''
       LEFT JOIN users u2 ON sr.phone_number = u2.phone_number AND sr.phone_number IS NOT NULL AND sr.phone_number != ''
       WHERE sr.processed = false
       ORDER BY sr.sale_date ASC`
    );
    return result.rows;
  },

  async markAsProcessed(recordIds, pointsEarned) {
    const result = await query(
      `UPDATE sales_records 
       SET processed = true,
           points_earned = $2,
           processed_at = CURRENT_TIMESTAMP
       WHERE record_id = ANY($1)
       RETURNING *`,
      [recordIds, pointsEarned]
    );
    return result.rows;
  },

  async getUserSales(userId, limit = 50) {
    const result = await query(
      `SELECT * FROM sales_records 
       WHERE user_id = $1 
       ORDER BY sale_date DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async getSalesByDateRange(startDate, endDate) {
    const result = await query(
      `SELECT * FROM sales_records 
       WHERE sale_date BETWEEN $1 AND $2
       ORDER BY sale_date DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }
};
