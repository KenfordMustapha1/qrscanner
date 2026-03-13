import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [settings, setSettings] = useState({
    lateCutoffTime: '08:10',
    qrTokenTtlSeconds: 30,
    scanSchedule: {
      timeIn: { start: '07:30', end: '08:10' },
      timeOut: { start: '16:00', end: '17:30' }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [qrModalUser, setQrModalUser] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);

  // Filters for attendance logs
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSearch, setFilterSearch] = useState('');
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({ employeeId: '', name: '', department: '', position: '', profilePhotoUrl: '', email: '', password: '' });
  const [showQR, setShowQR] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const params = { date: filterDate };
      if (filterSearch.trim()) params.search = filterSearch.trim();
      const response = await api.get('/admin/attendance', { params });
      setAttendance(response.data.attendance);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  }, [filterDate, filterSearch]);

  const fetchStats = useCallback(async (date) => {
    try {
      const d = date || new Date().toISOString().split('T')[0];
      const response = await api.get('/admin/attendance/stats', {
        params: { date: d }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/admin/attendance/analytics', {
        params: { days: 14 }
      });
      setAnalytics(response.data.analytics || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, [fetchUsers, fetchSettings]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats(); // Uses today's date
      fetchAnalytics();
    } else if (activeTab === 'logs') {
      fetchAttendance();
    }
  }, [activeTab, filterDate, filterSearch, fetchStats, fetchAttendance, fetchAnalytics]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await api.post('/admin/create-user', formData);
      setSuccess('Employee created successfully!');
      setQrCodeImage(response.data.qrCodeImage);
      setShowQR(true);
      setFormData({ employeeId: '', name: '', department: '', position: '', profilePhotoUrl: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.put(`/admin/users/${editingUser._id}`, formData);
      setSuccess('Employee updated successfully!');
      setEditingUser(null);
      setFormData({ employeeId: '', name: '', department: '', position: '', profilePhotoUrl: '', email: '', password: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This will also remove their attendance records.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/users/${user._id}`);
      setSuccess('User deleted successfully!');
      fetchUsers();
      if (stats) fetchStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRegenerateQR = async (user) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/admin/users/${user._id}/regenerate-qr`);
      setQrCodeImage(response.data.qrCodeImage);
      setQrModalUser(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate QR');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put('/admin/settings', {
        lateCutoffTime: settings.lateCutoffTime,
        qrTokenTtlSeconds: settings.qrTokenTtlSeconds,
        scanSchedule: settings.scanSchedule
      });
      setSuccess('Settings saved!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const handleExport = async (format) => {
    setError('');
    try {
      const params = { startDate: exportStartDate, endDate: exportEndDate };
      const endpoint = format === 'excel'
        ? '/admin/export-attendance/excel'
        : format === 'pdf'
          ? '/admin/export-attendance/pdf'
          : '/admin/export-attendance';
      const response = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });
      const ext = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${Date.now()}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export attendance');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      employeeId: user.employeeId || '',
      name: user.name || '',
      department: user.department || '',
      email: user.email || '',
      password: ''
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'users', label: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'logs', label: 'Attendance Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">QR</div>
            <span className="logo-text">Attendance</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
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

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'users' && 'Employee Management'}
              {activeTab === 'logs' && 'Attendance Logs'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="dashboard-subtitle">
              {activeTab === 'dashboard' && 'Overview of today\'s attendance and statistics'}
              {activeTab === 'users' && 'Add, edit, and manage employees with QR codes'}
              {activeTab === 'logs' && 'View and filter attendance records'}
              {activeTab === 'settings' && 'Configure late detection and system preferences'}
            </p>
          </div>
          <div className="header-actions">
            <Link to="/scan" className="btn btn-secondary" title="Open QR Scanner">
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan
            </Link>
            {activeTab === 'users' && (
              <button onClick={() => { setShowModal(true); setEditingUser(null); setFormData({ employeeId: '', name: '', department: '', position: '', profilePhotoUrl: '', email: '', password: '' }); }} className="btn btn-accent">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </button>
            )}
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid stats-grid-5">
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats?.presentToday ?? '-'}</div>
                  <div className="stat-label">Present Today</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-red">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats?.absent ?? '-'}</div>
                  <div className="stat-label">Absent</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-orange">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats?.late ?? '-'}</div>
                  <div className="stat-label">Late</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-green">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats?.attendancePercent ?? 0}%</div>
                  <div className="stat-label">Attendance %</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-purple">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Total Employees</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card chart-card">
                <h2 className="card-title">Attendance Trend (Last 14 Days)</h2>
                <div className="chart-container">
                  {analytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#161DEB" fill="#161DEB" fillOpacity={0.3} name="Attendance" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No attendance data for the last 14 days.</div>
                  )}
                </div>
              </div>
              <div className="card">
                <h2 className="card-title">Recent Scans</h2>
                {stats?.recentScans?.length > 0 ? (
                  <div className="recent-list">
                    {stats.recentScans.map((record) => (
                      <div key={record._id} className="recent-item">
                        <div className="recent-info">
                          <div className="recent-name">{record.userId?.name || 'N/A'}</div>
                          <div className="recent-time">
                            {new Date(record.date).toLocaleDateString()} | In: {record.timeIn || record.time}
                            {record.timeOut && ` • Out: ${record.timeOut}`}
                          </div>
                        </div>
                        <div className={`recent-status status-${(record.status || '').toLowerCase()}`}>
                          {record.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No scans today yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="dashboard-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">All Employees</h2>
                <span className="card-badge">{users.length}</span>
              </div>
              <div className="users-list">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>No employees found. Add an employee to get started.</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>{user.employeeId || '-'}</td>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-small">{user.name?.charAt(0).toUpperCase()}</div>
                              <span>{user.name}</span>
                            </div>
                          </td>
                          <td>{user.department || '-'}</td>
                          <td>{user.email}</td>
                          <td><span className="role-badge">{user.role}</span></td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button onClick={() => openEditModal(user)} className="btn-icon-small" title="Edit">
                                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => handleRegenerateQR(user)} className="btn-icon-small" title="QR Code">
                                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteUser(user)} className="btn-icon-small btn-danger-icon" title="Delete">
                                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="dashboard-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Attendance Logs</h2>
                <div className="card-actions">
                  <div className="filter-group">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="input-date"
                    />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="input-search"
                    />
                  </div>
                  <div className="export-group">
                    <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="input-date-small" />
                    <span>to</span>
                    <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="input-date-small" />
                    <button onClick={() => handleExport('csv')} className="btn btn-secondary btn-sm">CSV</button>
                    <button onClick={() => handleExport('excel')} className="btn btn-secondary btn-sm">Excel</button>
                    <button onClick={() => handleExport('pdf')} className="btn btn-secondary btn-sm">PDF</button>
                  </div>
                </div>
              </div>
              <div className="attendance-list">
                {attendance.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p>No attendance records found for the selected date.</p>
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
                          <td><span className={`status-badge status-${(record.status || '').toLowerCase()}`}>{record.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="dashboard-content">
            <div className="card">
              <h2 className="card-title">Late Detection</h2>
              <p className="card-subtitle">Employees who scan after this time will be marked as Late.</p>
              <form onSubmit={handleSaveSettings} className="settings-form">
                <div className="input-group">
                  <label htmlFor="lateCutoff">Late Cutoff Time (24h format)</label>
                  <input
                    type="time"
                    id="lateCutoff"
                    value={settings.lateCutoffTime || '08:10'}
                    onChange={(e) => setSettings({ ...settings, lateCutoffTime: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="qrTtl">QR Expiry (seconds)</label>
                  <input
                    type="number"
                    id="qrTtl"
                    min={10}
                    max={300}
                    value={settings.qrTokenTtlSeconds ?? 30}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        qrTokenTtlSeconds: Math.max(10, Math.min(300, Number(e.target.value) || 30))
                      })
                    }
                  />
                </div>
                <div className="settings-schedule">
                  <h3 className="settings-section-title">Scanner Schedule</h3>
                  <div className="schedule-grid">
                    <div className="schedule-card">
                      <div className="schedule-title">Time-In Schedule</div>
                      <div className="schedule-row">
                        <label>Start</label>
                        <input
                          type="time"
                          value={settings.scanSchedule?.timeIn?.start || '07:30'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              scanSchedule: {
                                ...settings.scanSchedule,
                                timeIn: { ...settings.scanSchedule.timeIn, start: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                      <div className="schedule-row">
                        <label>End</label>
                        <input
                          type="time"
                          value={settings.scanSchedule?.timeIn?.end || '08:10'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              scanSchedule: {
                                ...settings.scanSchedule,
                                timeIn: { ...settings.scanSchedule.timeIn, end: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="schedule-card">
                      <div className="schedule-title">Time-Out Schedule</div>
                      <div className="schedule-row">
                        <label>Start</label>
                        <input
                          type="time"
                          value={settings.scanSchedule?.timeOut?.start || '16:00'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              scanSchedule: {
                                ...settings.scanSchedule,
                                timeOut: { ...settings.scanSchedule.timeOut, start: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                      <div className="schedule-row">
                        <label>End</label>
                        <input
                          type="time"
                          value={settings.scanSchedule?.timeOut?.end || '17:30'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              scanSchedule: {
                                ...settings.scanSchedule,
                                timeOut: { ...settings.scanSchedule.timeOut, end: e.target.value }
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-accent">Save Settings</button>
              </form>
            </div>
          </div>
        )}

        {/* Create/Edit User Modal */}
        {(showModal || editingUser) && (
          <div className="modal-overlay" onClick={() => !showQR && (setShowModal(false), setEditingUser(null))}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editingUser ? 'Edit Employee' : 'Add New Employee'}</h2>
                {!showQR && (
                  <button className="modal-close" onClick={() => { setShowModal(false); setEditingUser(null); }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {editingUser ? (
                <form onSubmit={handleUpdateUser} className="modal-body">
                  <div className="input-group">
                    <label htmlFor="edit-employeeId">Employee ID</label>
                    <input
                      type="text"
                      id="edit-employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-name">Name</label>
                    <input
                      type="text"
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-department">Department</label>
                    <input
                      type="text"
                      id="edit-department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-position">Position</label>
                    <input
                      type="text"
                      id="edit-position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Enter position (optional)"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-photo">Profile Photo URL</label>
                    <input
                      type="url"
                      id="edit-photo"
                      value={formData.profilePhotoUrl}
                      onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                      placeholder="https://... (optional)"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-email">Email</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="Enter email"
                    />
                  </div>
                  <button type="submit" className="btn btn-accent" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateUser} className="modal-body">
                  <div className="input-group">
                    <label htmlFor="employeeId">Employee ID</label>
                    <input
                      type="text"
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter employee name"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="position">Position</label>
                    <input
                      type="text"
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Enter position (optional)"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="profilePhotoUrl">Profile Photo URL</label>
                    <input
                      type="url"
                      id="profilePhotoUrl"
                      value={formData.profilePhotoUrl}
                      onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                      placeholder="https://... (optional)"
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
                      placeholder="Enter employee email"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Set an employee password"
                    />
                  </div>
                  <button type="submit" className="btn btn-accent" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Creating...' : 'Create Employee'}
                  </button>
                </form>
              )}

              {showQR && qrCodeImage && (
                <div className="qr-display">
                  <div className="qr-header">
                    <h3>QR Code {qrModalUser ? 'Regenerated' : 'Generated'}</h3>
                    <p className="qr-subtitle">Share this QR code with the student</p>
                  </div>
                  <div className="qr-image-container">
                    <img src={qrCodeImage} alt="QR Code" className="qr-image" />
                  </div>
                  <button
                    onClick={() => { setShowQR(false); setShowModal(false); setQrModalUser(null); }} 
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Modal (standalone - for regenerate) */}
        {qrModalUser && qrCodeImage && !showModal && !editingUser && (
          <div className="modal-overlay" onClick={() => { setQrModalUser(null); setQrCodeImage(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">QR Code - {qrModalUser.name}</h2>
                <button className="modal-close" onClick={() => { setQrModalUser(null); setQrCodeImage(null); }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="qr-display">
                <div className="qr-image-container">
                  <img src={qrCodeImage} alt="QR Code" className="qr-image" />
                </div>
                <button onClick={() => { setQrModalUser(null); setQrCodeImage(null); }} className="btn btn-secondary" style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
