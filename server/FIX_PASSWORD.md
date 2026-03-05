# Fixing MongoDB Connection String with Special Characters

## ⚠️ Issue Found

Your password `Att3ndance@2026` contains an `@` symbol, which is a special character in connection strings.

The `@` in your password is being interpreted as the separator between credentials and hostname, which breaks the connection.

## ✅ Solution: URL Encode the Password

You need to replace `@` in your password with `%40` (URL encoding for `@`).

### Your Current Connection String:
```
mongodb+srv://attendanceAdmin:Att3ndance@2026@cluster0.kkvlqkk.mongodb.net/?appName=Cluster0
```

### Fixed Connection String:
```
mongodb+srv://attendanceAdmin:Att3ndance%402026@cluster0.kkvlqkk.mongodb.net/qr-attendance?retryWrites=true&w=majority
```

**Changes made:**
1. `Att3ndance@2026` → `Att3ndance%402026` (encoded the `@`)
2. Added `/qr-attendance` before `?` (database name)
3. Changed `?appName=Cluster0` to `?retryWrites=true&w=majority` (standard options)

## 📝 Update Your .env File

Open `server/.env` and set:

```env
MONGO_URI=mongodb+srv://attendanceAdmin:Att3ndance%402026@cluster0.kkvlqkk.mongodb.net/qr-attendance?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
PORT=5000
```

## 🔍 Other Special Characters That Need Encoding

If your password contains these characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

## ✅ Test It

After updating, run:
```bash
npm run validate-env
npm start
```
