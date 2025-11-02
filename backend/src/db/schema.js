/**
 * Database schema and migrations
 */

export async function createTables(pool) {
  // Handles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS handles (
      handle VARCHAR(255) PRIMARY KEY,
      wallet_address VARCHAR(42) NOT NULL UNIQUE,
      device_pub_key TEXT NOT NULL,
      signature TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index on wallet_address for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_handles_wallet_address ON handles(wallet_address);
  `);

  // Consent requests table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consent_requests (
      id VARCHAR(255) PRIMARY KEY,
      from_handle VARCHAR(255) NOT NULL,
      from_address VARCHAR(42) NOT NULL,
      to_handle VARCHAR(255) NOT NULL,
      template VARCHAR(100) NOT NULL,
      consent_data JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_handle) REFERENCES handles(handle),
      FOREIGN KEY (to_handle) REFERENCES handles(handle)
    );
  `);

  // Create indexes for faster queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_consent_requests_to_handle ON consent_requests(to_handle);
    CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON consent_requests(status);
  `);

  // Device registrations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_registrations (
      id SERIAL PRIMARY KEY,
      handle VARCHAR(255) NOT NULL,
      device_id VARCHAR(255) NOT NULL,
      push_token TEXT NOT NULL,
      platform VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (handle) REFERENCES handles(handle),
      UNIQUE(handle, device_id)
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_device_registrations_handle ON device_registrations(handle);
    CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);
  `);

  // Transactions table (for tracking on-chain transactions)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      tx_hash VARCHAR(66) UNIQUE NOT NULL,
      chain_id INTEGER NOT NULL,
      consent_id VARCHAR(255),
      from_address VARCHAR(42) NOT NULL,
      to_address VARCHAR(42),
      status VARCHAR(50) DEFAULT 'pending',
      block_number BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
    CREATE INDEX IF NOT EXISTS idx_transactions_consent_id ON transactions(consent_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  `);

  // Test users table (for development/testing)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_users (
      handle VARCHAR(255) PRIMARY KEY,
      wallet_address VARCHAR(42) NOT NULL,
      device_pub_key TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed test users if table is empty
  const testUserCheck = await pool.query('SELECT COUNT(*) FROM test_users');
  if (parseInt(testUserCheck.rows[0].count) === 0) {
    await seedTestUsers(pool);
  }

  console.log('✅ Database tables created/verified');
}

/**
 * Seed test users for development
 */
async function seedTestUsers(pool) {
  const testUsers = [
    {
      handle: 'sarah',
      walletAddress: '0x408D2F87baF586bC3099Fe56F0C19e6A23F7275b',
      devicePubKey: 'N8Ayuv1NP2FtDchQnr/wszNXPd9tJlbpE3r4ye6l/kU=',
    },
    {
      handle: 'mike',
      walletAddress: '0x8Bd195b826f8079eb5A18d3D6161466c0B5D75a8',
      devicePubKey: 'WukkTos1tmQTwHO2LDYc/KILh/0M7N1wzxX1wycxzzE=',
    },
    {
      handle: 'katie',
      walletAddress: '0x0EF2351b8D27E30E192928F6e80F7319e14BA136',
      devicePubKey: '4NNBWBq43Th23FCXuZgbN2Snjk7C+vRbnL5rWYqkREo=',
    },
  ];

  for (const user of testUsers) {
    try {
      // First, add to handles table
      await pool.query(
        `INSERT INTO handles (handle, wallet_address, device_pub_key) 
         VALUES ($1, $2, $3)
         ON CONFLICT (handle) DO NOTHING`,
        [user.handle, user.walletAddress, user.devicePubKey]
      );

      // Then, add to test_users table
      await pool.query(
        `INSERT INTO test_users (handle, wallet_address, device_pub_key) 
         VALUES ($1, $2, $3)
         ON CONFLICT (handle) DO NOTHING`,
        [user.handle, user.walletAddress, user.devicePubKey]
      );
    } catch (error) {
      console.error(`Error seeding test user ${user.handle}:`, error);
    }
  }

  console.log('✅ Test users seeded');
}

