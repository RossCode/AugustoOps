const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('Connected successfully!');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_create_auth_tables.sql');
    console.log('Reading migration file:', migrationPath);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const [tables] = await connection.query("SHOW TABLES LIKE 'augusto_%'");
    console.log('\nCreated tables:');
    tables.forEach(row => {
      console.log('  -', Object.values(row)[0]);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

runMigration();
