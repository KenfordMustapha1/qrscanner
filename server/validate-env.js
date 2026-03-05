require('dotenv').config();

console.log('🔍 Validating .env file...\n');

let hasErrors = false;

// Check MONGO_URI
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing');
  hasErrors = true;
} else if (process.env.MONGO_URI === 'your_mongodb_atlas_connection_string_here') {
  console.error('❌ MONGO_URI still contains placeholder text');
  console.error('   Please replace it with your actual MongoDB Atlas connection string');
  hasErrors = true;
} else if (!process.env.MONGO_URI.startsWith('mongodb://') && !process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  console.error('❌ MONGO_URI has invalid format');
  console.error(`   Current: ${process.env.MONGO_URI.substring(0, 60)}...`);
  console.error('   Must start with "mongodb://" or "mongodb+srv://"');
  hasErrors = true;
} else {
  console.log('✅ MONGO_URI is set correctly');
  // Mask password in output
  const masked = process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@');
  console.log(`   ${masked.substring(0, 80)}...`);
}

// Check JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing');
  hasErrors = true;
} else if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_change_in_production') {
  console.warn('⚠️  JWT_SECRET still contains placeholder text');
  console.warn('   Consider changing it to a secure random string');
} else {
  console.log('✅ JWT_SECRET is set');
}

// Check PORT
if (!process.env.PORT) {
  console.warn('⚠️  PORT not set, will use default: 5000');
} else {
  console.log(`✅ PORT is set to ${process.env.PORT}`);
}

console.log('');

if (hasErrors) {
  console.error('❌ Validation failed! Please fix the errors above.');
  console.error('\n📚 See server/SETUP_ENV.md for help setting up MongoDB Atlas');
  process.exit(1);
} else {
  console.log('✅ All environment variables are configured correctly!');
  console.log('   You can now start the server with: npm start');
}
