const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Check if required environment variables are set
if (!process.env.MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI is not set in .env file');
  console.error('📝 Please create a .env file in the server directory with:');
  console.error('   MONGO_URI=your_mongodb_atlas_connection_string');
  console.error('   JWT_SECRET=your_secret_key');
  console.error('   PORT=5000');
  console.error('\n💡 See server/env.example for a template');
  process.exit(1);
}

// Validate MONGO_URI format
if (!process.env.MONGO_URI.startsWith('mongodb://') && !process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  console.error('❌ ERROR: Invalid MongoDB connection string format');
  console.error('📝 Your MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
  console.error(`   Current value: ${process.env.MONGO_URI.substring(0, 50)}...`);
  console.error('\n💡 You need to replace the placeholder with your actual MongoDB Atlas connection string.');
  console.error('   Steps:');
  console.error('   1. Go to MongoDB Atlas → Connect → Connect your application');
  console.error('   2. Copy the connection string');
  console.error('   3. Replace <password> with your database password');
  console.error('   4. Replace <dbname> with "qr-attendance"');
  console.error('   5. Update the MONGO_URI in server/.env file');
  console.error('\n📚 See server/SETUP_ENV.md for detailed instructions');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  
  // Create default admin if it doesn't exist
  const Admin = require('./models/Admin');
  Admin.findOne({ email: 'admin@example.com' })
    .then(async (admin) => {
      if (!admin) {
        const defaultAdmin = new Admin({
          name: 'Admin',
          email: 'admin@example.com',
          password: 'admin123' // Should be changed in production
        });
        await defaultAdmin.save();
        console.log('✅ Default admin created (email: admin@example.com, password: admin123)');
      }
    })
    .catch(err => console.error('Error creating default admin:', err));
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
