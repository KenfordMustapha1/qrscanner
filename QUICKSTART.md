# Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (Free tier M0)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
5. Whitelist your IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your IP
6. Get connection string:
   - Go to "Database" → "Connect"
   - Click "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `qr-attendance`

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
# Copy env.example to .env and fill in your MongoDB URI
# Windows:
copy env.example .env
# Mac/Linux:
cp env.example .env

# Edit .env file with your MongoDB connection string
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-attendance?retryWrites=true&w=majority
# JWT_SECRET=your_secret_key_here
# PORT=5000

# Start the server
npm start
```

### Step 3: Frontend Setup

```bash
# Open a new terminal
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the React app
npm start
```

### Step 4: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Default Admin Login:
  - Email: `admin@example.com`
  - Password: `admin123`

## 📱 Using the System

### For Admin:

1. Go to http://localhost:3000/login
2. Login with default credentials
3. Create users - each user gets a unique QR code
4. View attendance records
5. Export attendance to CSV

### For Scanning:

1. Go to http://localhost:3000/scan
2. Allow camera permissions
3. Scan a user's QR code
4. Attendance is automatically recorded

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check your connection string in `.env`
- Verify your IP is whitelisted in MongoDB Atlas
- Check your database username and password

### "Camera not working"
- Ensure you're on HTTPS or localhost
- Grant camera permissions in browser
- Try a different browser (Chrome recommended)

### "CORS errors"
- Make sure backend is running on port 5000
- Check that frontend is using correct API URL

### "JWT token invalid"
- Clear browser localStorage
- Login again

## 📝 Next Steps

1. Change default admin password
2. Create your first user
3. Test QR code scanning
4. Customize as needed

Happy coding! 🎉
