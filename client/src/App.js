import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import QRScanner from './pages/QRScanner';
import { AuthProvider } from './context/AuthContext';
import { EmployeeAuthProvider } from './context/EmployeeAuthContext';
import PrivateRoute from './components/PrivateRoute';
import EmployeePrivateRoute from './components/EmployeePrivateRoute';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeHome from './pages/employee/EmployeeHome';
import MyProfile from './pages/employee/MyProfile';
import MyQRCode from './pages/employee/MyQRCode';
import AttendanceHistory from './pages/employee/AttendanceHistory';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <EmployeeAuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <Routes>
              {/* Admin */} 
              <Route path="/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* Employee */} 
              <Route path="/employee/login" element={<EmployeeLogin />} />
              <Route
                path="/employee"
                element={
                  <EmployeePrivateRoute>
                    <EmployeeLayout />
                  </EmployeePrivateRoute>
                }
              >
                <Route index element={<EmployeeHome />} />
                <Route path="profile" element={<MyProfile />} />
                <Route path="qr" element={<MyQRCode />} />
                <Route path="history" element={<AttendanceHistory />} />
              </Route>

              {/* Public */} 
              <Route path="/scan" element={<QRScanner />} />
              <Route path="/" element={<Navigate to="/employee/login" replace />} />
            </Routes>
          </div>
        </Router>
      </EmployeeAuthProvider>
    </AuthProvider>
  );
}

export default App;
