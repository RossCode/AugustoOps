const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { createTunnel } = require('tunnel-ssh');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  let connection;
  let sshTunnel;

  try {
    const useSSH = process.env.USE_SSH_TUNNEL === 'true';

    // Create SSH tunnel if needed
    if (useSSH) {
      console.log('Creating SSH tunnel...');
      const tunnelConfig = {
        host: process.env.SSH_HOST,
        port: 22,
        username: process.env.SSH_USER,
        privateKey: fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH),
        passphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE,
        dstHost: 'localhost',
        dstPort: 3306,
        localHost: 'localhost',
        localPort: parseInt(process.env.DB_PORT || '3307')
      };

      sshTunnel = await createTunnel(tunnelConfig);
      console.log('SSH tunnel established on port', process.env.DB_PORT || 3307);
    }

    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: useSSH ? 'localhost' : process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('Connected successfully!');

    // Read the migration file from command line argument or default
    const migrationFile = process.argv[2] || 'migrations/001_create_auth_tables.sql';
    const migrationPath = path.join(__dirname, '..', migrationFile);
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
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200) + '...');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
    if (sshTunnel) {
      sshTunnel.close();
      console.log('SSH tunnel closed.');
    }
  }
}

runMigration();
