# Setting Up Your .env File

## ❌ Error: MONGO_URI is undefined

This error means the `.env` file is missing or doesn't have the `MONGO_URI` variable set.

## ✅ Quick Fix

### Step 1: Create the .env file

In the `server` directory, create a file named `.env` (note the dot at the beginning).

### Step 2: Add your MongoDB connection string

Copy this template into your `.env` file:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-attendance?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5000
```

### Step 3: Replace the values

1. **MONGO_URI**: Replace with your actual MongoDB Atlas connection string
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `qr-attendance` (or your preferred database name)

2. **JWT_SECRET**: Use any random string (e.g., `my_secret_key_12345`)

3. **PORT**: Keep as `5000` (or change if needed)

### Example .env file:

```env
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/qr-attendance?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_key_2024
PORT=5000
```

### Step 4: Restart the server

After creating the `.env` file, restart your server:

```bash
npm start
```

## 🔒 Security Note

**Never commit the `.env` file to git!** It's already in `.gitignore` to protect your credentials.

## 📚 Need Help Setting Up MongoDB Atlas?

See `QUICKSTART.md` in the root directory for detailed MongoDB Atlas setup instructions.
