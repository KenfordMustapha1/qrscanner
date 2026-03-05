const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists!');
  process.exit(0);
}

// Read the example file
if (fs.existsSync(envExamplePath)) {
  const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envPath, exampleContent);
  console.log('✅ Created .env file from env.example');
  console.log('');
  console.log('⚠️  IMPORTANT: Please edit the .env file and add your MongoDB Atlas connection string!');
  console.log('   Replace "your_mongodb_atlas_connection_string_here" with your actual connection string.');
  console.log('');
  console.log('📝 Steps:');
  console.log('   1. Go to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)');
  console.log('   2. Click "Connect" on your cluster');
  console.log('   3. Choose "Connect your application"');
  console.log('   4. Copy the connection string');
  console.log('   5. Replace <password> with your database password');
  console.log('   6. Replace <dbname> with "qr-attendance"');
  console.log('   7. Paste it into the .env file as MONGO_URI');
} else {
  // Create a basic .env file
  const defaultContent = `MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5000
`;
  fs.writeFileSync(envPath, defaultContent);
  console.log('✅ Created .env file with default template');
  console.log('');
  console.log('⚠️  IMPORTANT: Please edit the .env file and add your MongoDB Atlas connection string!');
}
