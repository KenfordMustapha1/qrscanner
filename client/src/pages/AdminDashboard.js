import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  
  // Create user form state
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/admin/attendance');
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Calculate stats
  const todayAttendance = attendance.filter(record => {
    const today = new Date().toDateString();
    const recordDate = new Date(record.date).toDateString();
    return today === recordDate;
  }).length;

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/admin/create-user', formData);
      setSuccess('User created successfully!');
      setQrCodeImage(response.data.qrCodeImage);
      setShowQR(true);
      setFormData({ name: '', email: '' });
      fetchUsers();
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await api.get('/admin/export-attendance', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to export attendance');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">QR</div>
            <span className="logo-text">Attendance</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Attendance</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{admin?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{admin?.name}</div>
              <div className="user-email">{admin?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'attendance' && 'Attendance Records'}
            </h1>
            <p className="dashboard-subtitle">
              {activeTab === 'dashboard' && 'Welcome back! Here\'s what\'s happening today.'}
              {activeTab === 'users' && 'Manage users and generate QR codes'}
              {activeTab === 'attendance' && 'View and export attendance records'}
            </p>
          </div>
          {activeTab === 'users' && (
            <button onClick={() => setShowModal(true)} className="btn btn-accent">
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </button>
          )}
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-orange">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{todayAttendance}</div>
                  <div className="stat-label">Today's Attendance</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{attendance.length}</div>
                  <div className="stat-label">Total Records</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h2 className="card-title">Recent Attendance</h2>
              {attendance.length === 0 ? (
                <p className="empty-state">No attendance records yet.</p>
              ) : (
                <div className="recent-list">
                  {attendance.slice(0, 5).map((record) => (
                    <div key={record._id} className="recent-item">
                      <div className="recent-info">
                        <div className="recent-name">{record.userId?.name || 'N/A'}</div>
                        <div className="recent-time">
                          {new Date(record.date).toLocaleDateString()} | In:{' '}
                          {record.timeIn || record.time}
                          {record.timeOut && ` • Out: ${record.timeOut}`}
                        </div>
                      </div>
                      <div className={`recent-status status-${record.status?.toLowerCase()}`}>
                        {record.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="dashboard-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">All Users</h2>
                <span className="card-badge">{users.length}</span>
              </div>
              <div className="users-list">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>No users found. Create a user to get started.</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-small">{user.name?.charAt(0).toUpperCase()}</div>
                              <span>{user.name}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td><span className="role-badge">{user.role}</span></td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      {activeTab === 'attendance' && (
        <div className="dashboard-content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Attendance Records</h2>
              <div className="card-actions">
                <span className="card-badge">{attendance.length}</span>
                <button onClick={handleExportAttendance} className="btn btn-secondary">
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
            <div className="attendance-list">
              {attendance.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p>No attendance records found.</p>
                </div>
              ) : (
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">{record.userId?.name?.charAt(0).toUpperCase() || 'N'}</div>
                            <span>{record.userId?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{record.userId?.email || 'N/A'}</td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.timeIn || record.time}</td>
                        <td>{record.timeOut || '-'}</td>
                        <td><span className={`status-badge status-${record.status?.toLowerCase()}`}>{record.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !showQR && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New User</h2>
              {!showQR && (
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <form onSubmit={handleCreateUser} className="modal-body">
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter user name"
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter user email"
                />
              </div>
              <button type="submit" className="btn btn-accent" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>

            {showQR && qrCodeImage && (
              <div className="qr-display">
                <div className="qr-header">
                  <h3>QR Code Generated</h3>
                  <p className="qr-subtitle">Share this QR code with the user</p>
                </div>
                <div className="qr-image-container">
                  <img src={qrCodeImage} alt="QR Code" className="qr-image" />
                </div>
                <button onClick={() => { setShowQR(false); setShowModal(false); }} className="btn btn-secondary" style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default AdminDashboard;
