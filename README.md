# QR Code Attendance System

A full-stack QR Code Attendance System built with React, Node.js, Express, and MongoDB Atlas.

## 🛠 Tech Stack

- **Frontend**: React JS (with functional components and hooks)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas (using Mongoose)
- **QR Code Generator**: qrcode npm package
- **QR Code Scanner**: html5-qrcode
- **Authentication**: JWT-based authentication
- **Styling**: Custom CSS with modern UI

## 🎯 Features

### Admin Features
- Secure login with JWT authentication
- Create users (students/employees)
- Automatically generate unique QR codes for each user
- View all users
- View attendance records
- Export attendance to CSV
- Filter attendance by date

### User Features
- Unique QR code for each user
- Automatic attendance recording when QR code is scanned
- Prevent duplicate attendance for the same day

## 📁 Project Structure

```
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   └── attendanceRoutes.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   └── attendanceController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── QRScanner.js
│   │   ├── components/
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── styles/
│   │   │   ├── AdminLogin.css
│   │   │   ├── AdminDashboard.css
│   │   │   └── QRScanner.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5000
```

4. Get your MongoDB Atlas connection string:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster (free tier is fine)
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your database name (e.g., `qr-attendance`)

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the React app:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## 🔐 Default Admin Credentials

After starting the server for the first time, a default admin account is created:

- **Email**: `admin@example.com`
- **Password**: `admin123`

**⚠️ Important**: Change the default password in production!

## 📊 API Endpoints

### Admin Routes (Protected - Requires JWT Token)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/create-user` - Create a new user
- `GET /api/admin/users` - Get all users
- `GET /api/admin/attendance` - Get attendance records
- `GET /api/admin/export-attendance` - Export attendance to CSV

### Attendance Routes (Public)

- `POST /api/attendance/scan` - Scan QR code and record attendance

### Example API Usage

**Login:**
```bash
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Create User:**
```bash
POST http://localhost:5000/api/admin/create-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Scan QR Code:**
```bash
POST http://localhost:5000/api/attendance/scan
Content-Type: application/json

{
  "qrCode": "uuid-string-here"
}
```

## 🎨 Pages

1. **Admin Login** (`/login`) - Login page for administrators
2. **Admin Dashboard** (`/admin`) - Dashboard for managing users and viewing attendance
3. **QR Scanner** (`/scan`) - Public page for scanning QR codes

## 🔒 Security Features

- JWT-based authentication for admin routes
- Password hashing using bcryptjs
- Environment variables for sensitive data
- Protected routes on frontend
- Duplicate attendance prevention (same user, same day)

## 📝 Database Schemas

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  role: String (default: "user"),
  qrCode: String (unique),
  createdAt: Date
}
```

### Attendance Schema
```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  time: String,
  status: String (default: "Present")
}
```

### Admin Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed)
}
```

## 🚀 Deployment

### Backend Deployment (Heroku/Netlify/Railway)

1. Set environment variables in your hosting platform
2. Update CORS settings if needed
3. Deploy the server

### Frontend Deployment (Netlify/Vercel)

1. Build the React app: `npm run build`
2. Set `REACT_APP_API_URL` to your backend URL
3. Deploy the `build` folder

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or your server IP)
- Verify your connection string is correct
- Check that your database user has read/write permissions

### QR Scanner Not Working
- Ensure you're using HTTPS or localhost (required for camera access)
- Grant camera permissions in your browser
- Check browser console for errors

### CORS Errors
- Verify the backend CORS settings allow your frontend URL
- Check that the API URL in frontend matches your backend URL

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development

For development, you can run both servers simultaneously:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

## 🎯 Future Enhancements

- Time-in and time-out logic
- Advanced filtering and search
- Pagination for large datasets
- User profile management
- Email notifications
- Analytics dashboard
- Mobile app support
