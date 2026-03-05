# Starting the Backend Server

## Quick Fix for Connection Refused Error

The error `ERR_CONNECTION_REFUSED` means the backend server is not running. Follow these steps:

### Step 1: Create .env file

Create a `.env` file in the `server` directory with the following content:

```env
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5000
```

**Important:** Replace `your_mongodb_atlas_connection_string_here` with your actual MongoDB Atlas connection string.

### Step 2: Install Dependencies (if not done)

```bash
cd server
npm install
```

### Step 3: Start the Server

```bash
npm start
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ Default admin created (email: admin@example.com, password: admin123)
🚀 Server running on port 5000
```

### Step 4: Keep Server Running

**Keep this terminal window open!** The server must be running for the frontend to work.

### Troubleshooting

**If you get MongoDB connection error:**
- Make sure you've set up MongoDB Atlas (see QUICKSTART.md)
- Check that your MONGO_URI in .env is correct
- Verify your IP is whitelisted in MongoDB Atlas

**If port 5000 is already in use:**
- Change PORT in .env to a different port (e.g., 5001)
- Update client/src/utils/api.js to use the new port
