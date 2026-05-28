import { query } from '../config/database.js';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url TEXT,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    address TEXT,
    registered BOOLEAN DEFAULT FALSE,
    pdpa_consent_at TIMESTAMP,
    authorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS points_balance (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    used_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS points_transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment')),
    description TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS sales_records (
    record_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    line_user_id VARCHAR(255),
    phone_number VARCHAR(20),
    customer_name VARCHAR(255),
    sale_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    points_earned INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    upload_batch_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS rewards (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS redemptions (
    redemption_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(reward_id) ON DELETE SET NULL,
    points_used INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    redemption_code VARCHAR(50) UNIQUE,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sales_records_processed ON sales_records(processed, sale_date);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sales_records_phone_number ON sales_records(phone_number);
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
  `,
  `
  ALTER TABLE sales_records ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
  `,
  `
  ALTER TABLE sales_records ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS registered BOOLEAN DEFAULT FALSE;
  `,
  `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS pdpa_consent_at TIMESTAMP;
  `,
  `
  ALTER TABLE sales_records ADD COLUMN IF NOT EXISTS customer_address TEXT;
  `
];

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await query(migrations[i]);
    }
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
