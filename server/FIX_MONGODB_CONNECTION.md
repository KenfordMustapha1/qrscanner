# Fix MongoDB Connection Error

## ❌ Current Error
```
Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```

This means your `.env` file still has the placeholder text instead of a real MongoDB connection string.

## ✅ Quick Fix Steps

### Option 1: If you already have MongoDB Atlas set up

1. **Open** `server/.env` file in a text editor

2. **Find this line:**
   ```
   MONGO_URI=your_mongodb_atlas_connection_string_here
   ```

3. **Replace it with your actual connection string:**
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-attendance?retryWrites=true&w=majority
   ```
   - Replace `username` with your MongoDB username
   - Replace `password` with your MongoDB password
   - Replace `cluster.mongodb.net` with your actual cluster address

4. **Also update JWT_SECRET:**
   ```
   JWT_SECRET=any_random_string_here_12345
   ```

5. **Save the file**

6. **Validate it:**
   ```bash
   npm run validate-env
   ```

7. **Start the server:**
   ```bash
   npm start
   ```

---

### Option 2: If you need to set up MongoDB Atlas (First Time)

#### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Verify your email

#### Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose **FREE** (M0) tier
3. Select a cloud provider and region (closest to you)
4. Click "Create"

#### Step 3: Create Database User
1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username (e.g., `admin`)
5. Enter a password (save this!)
6. Click "Add User"

#### Step 4: Whitelist Your IP
1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address
4. Click "Confirm"

#### Step 5: Get Connection String
1. Go to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

#### Step 6: Update .env File
1. Open `server/.env`
2. Replace the connection string:
   ```
   MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/qr-attendance?retryWrites=true&w=majority
   ```
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add `/qr-attendance` before the `?` (this is your database name)

3. Update JWT_SECRET:
   ```
   JWT_SECRET=my_secret_key_2024_change_this
   ```

#### Step 7: Test
```bash
npm run validate-env
npm start
```

---

## 📝 Example .env File

After setup, your `.env` should look like this:

```env
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/qr-attendance?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_jwt_key_2024
PORT=5000
```

**Important:** 
- Never share your `.env` file
- Never commit it to git (it's already in `.gitignore`)
- Keep your password secure

---

## 🔍 Validate Your Setup

Run this command to check if everything is correct:
```bash
npm run validate-env
```

You should see:
```
✅ MONGO_URI is set correctly
✅ JWT_SECRET is set
✅ PORT is set to 5000
✅ All environment variables are configured correctly!
```

---

## ❓ Still Having Issues?

1. Make sure there are **no spaces** around the `=` sign in `.env`
2. Make sure the connection string starts with `mongodb+srv://` or `mongodb://`
3. Make sure you replaced `<username>` and `<password>` with actual values
4. Make sure your IP is whitelisted in MongoDB Atlas
5. Check that your database user password doesn't have special characters that need URL encoding

If your password has special characters, you may need to URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- etc.
