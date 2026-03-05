# Troubleshooting MongoDB Atlas Connection

## ❌ Still Getting IP Whitelist Error?

If you've already whitelisted your IP but still getting the error, try these steps:

### Step 1: Verify Your Current IP

Your IP address may have changed. Check your current IP:
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

### Step 2: Double-Check MongoDB Atlas Network Access

1. Go to https://cloud.mongodb.com/
2. Click **"Network Access"** in the left sidebar
3. Verify your IP is listed (or `0.0.0.0/0` for "Allow from Anywhere")
4. Make sure the status shows **"Active"** (not "Pending")

### Step 3: Wait for Propagation

- MongoDB Atlas changes can take **2-5 minutes** to propagate
- Wait a few minutes after adding your IP
- Try restarting the server after waiting

### Step 4: Use "Allow Access from Anywhere" (Recommended for Development)

If you haven't already, this is the easiest solution:

1. Go to **Network Access** in MongoDB Atlas
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Click **"Confirm"**
5. Wait 2-3 minutes
6. Restart your server

This adds `0.0.0.0/0` which allows all IPs (safe for development).

### Step 5: Check for VPN/Proxy

- If you're using a VPN, you may need to whitelist the VPN's IP address
- If you're behind a corporate firewall, contact your IT department
- Try disconnecting VPN temporarily to test

### Step 6: Verify Connection String

Double-check your `.env` file has the correct connection string:
```env
MONGO_URI=mongodb+srv://attendanceAdmin:Att3ndance%402026@cluster0.kkvlqkk.mongodb.net/qr-attendance?retryWrites=true&w=majority
```

### Step 7: Test Connection with MongoDB Compass

Try connecting with MongoDB Compass (desktop app) to verify:
1. Download: https://www.mongodb.com/try/download/compass
2. Use the same connection string
3. If Compass works but Node.js doesn't, it's likely a network/firewall issue

### Step 8: Check Firewall/Antivirus

- Windows Firewall might be blocking the connection
- Antivirus software might be blocking Node.js
- Try temporarily disabling firewall/antivirus to test

### Step 9: Alternative - Use Local MongoDB (For Testing)

If Atlas continues to have issues, you can temporarily use local MongoDB:

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Update `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/qr-attendance
   ```
3. Start MongoDB service
4. Restart your Node.js server

## 🔍 Debug Commands

Check if you can reach MongoDB Atlas:
```powershell
# Test DNS resolution
nslookup cluster0.kkvlqkk.mongodb.net

# Test network connectivity (if port is open)
Test-NetConnection cluster0.kkvlqkk.mongodb.net -Port 27017
```

## ✅ Quick Checklist

- [ ] IP is whitelisted in MongoDB Atlas Network Access
- [ ] Status shows "Active" (not "Pending")
- [ ] Waited 2-5 minutes after whitelisting
- [ ] Restarted the server after whitelisting
- [ ] Not behind VPN that changes IP
- [ ] Firewall/antivirus not blocking connection
- [ ] Connection string is correct in `.env`
- [ ] Password is URL-encoded (if contains special chars)

## 🆘 Still Not Working?

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **Try "Allow Access from Anywhere"** (`0.0.0.0/0`) - easiest for development
3. **Contact MongoDB Support** if the issue persists
4. **Use Local MongoDB** as a temporary workaround
