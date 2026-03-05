# Troubleshooting Guide

## ❌ Error: ERR_CONNECTION_REFUSED

**Problem:** The frontend cannot connect to the backend server.

**Solution:** The backend server must be running before you can use the frontend.

### Quick Fix:

1. **Open a new terminal/command prompt**

2. **Navigate to the server directory:**
   ```bash
   cd server
   ```

3. **Create a `.env` file** (if it doesn't exist):
   - Copy `env.example` to `.env`
   - Fill in your MongoDB Atlas connection string
   - Example:
     ```env
     MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-attendance?retryWrites=true&w=majority
     JWT_SECRET=my_secret_key_12345
     PORT=5000
     ```

4. **Install dependencies** (if not done):
   ```bash
   npm install
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

6. **You should see:**
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Default admin created
   🚀 Server running on port 5000
   ```

7. **Keep this terminal open!** The server must keep running.

8. **Now try logging in again** in your browser.

---

## ⚠️ React Router Warnings

**Problem:** Console shows deprecation warnings about React Router v7.

**Status:** ✅ **FIXED** - These warnings have been resolved by adding future flags to the Router.

**Note:** These were just warnings and didn't affect functionality, but they're now fixed.

---

## 🔧 Other Common Issues

### MongoDB Connection Error

**Error:** `MongoServerError: Authentication failed`

**Solution:**
- Check your MongoDB Atlas connection string
- Verify username and password are correct
- Make sure your IP is whitelisted in MongoDB Atlas Network Access

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Find and close the process using port 5000, OR
2. Change the port in `server/.env`:
   ```env
   PORT=5001
   ```
3. Update `client/src/utils/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
   ```

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Make sure the backend server is running
- Check that the frontend is using the correct API URL
- Verify CORS is enabled in `server/server.js` (it should be)

### Camera Not Working (QR Scanner)

**Error:** Camera permission denied or not accessible

**Solution:**
- Use HTTPS or localhost (required for camera access)
- Grant camera permissions in your browser
- Try a different browser (Chrome recommended)
- Check browser console for specific errors

---

## 📋 Checklist Before Starting

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created
- [ ] Database user created
- [ ] IP whitelisted in MongoDB Atlas
- [ ] `.env` file created in `server/` directory
- [ ] MongoDB connection string added to `.env`
- [ ] Backend dependencies installed (`npm install` in `server/`)
- [ ] Frontend dependencies installed (`npm install` in `client/`)
- [ ] Backend server is running (`npm start` in `server/`)
- [ ] Frontend is running (`npm start` in `client/`)

---

## 🆘 Still Having Issues?

1. Check the browser console for errors
2. Check the server terminal for errors
3. Verify both servers are running
4. Make sure MongoDB Atlas is accessible
5. Check network/firewall settings
