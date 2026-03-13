import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';
import '../../styles/EmployeeDashboard.css';

const EmployeeLayout = () => {
  const navigate = useNavigate();
  const { employee, setEmployee, logout } = useEmployeeAuth();
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setMeError('');
        const res = await api.get('/employee/me');
        setMe(res.data);
        if (!employee && res.data?.employee) setEmployee(res.data.employee);
      } catch (e) {
        const status = e.response?.status;

        // Only force logout on auth-related errors
        if (status === 401 || status === 403) {
          logout();
          navigate('/employee/login', { replace: true });
          return;
        }

        setMeError(e.response?.data?.message || 'Failed to load your profile. Please try again later.');
      }
      setLoadingMe(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = useMemo(() => ([
    { to: '/employee', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/employee/profile', label: 'My Profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
    { to: '/employee/qr', label: 'My QR Code', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    { to: '/employee/history', label: 'Attendance History', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }
  ]), []);

  const onLogout = () => {
    logout();
    navigate('/employee/login', { replace: true });
  };

  const empName = me?.employee?.name || employee?.name || 'Employee';
  const empId = me?.employee?.employeeId || employee?.employeeId || '';
  const dept = me?.employee?.department || employee?.department || '';

  if (loadingMe) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="emp-shell">
      <aside className={`emp-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="emp-sidebar-header">
          <div className="emp-logo">
            <div className="emp-logo-icon">EM</div>
            <div>
              <div className="emp-logo-title">Employee</div>
              <div className="emp-logo-subtitle">Attendance</div>
            </div>
          </div>
        </div>

        <nav className="emp-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/employee'}
              className={({ isActive }) => `emp-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <svg className="emp-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button className="emp-nav-item logout" onClick={onLogout}>
            <svg className="emp-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>

        <div className="emp-sidebar-footer">
          <div className="emp-user">
            <div className="emp-avatar">{empName.charAt(0).toUpperCase()}</div>
            <div className="emp-user-meta">
              <div className="emp-user-name">{empName}</div>
              <div className="emp-user-sub">{empId}{dept ? ` • ${dept}` : ''}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="emp-main">
        <header className="emp-header">
          <button className="emp-burger" onClick={() => setMobileOpen((s) => !s)} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
          <div>
            <div className="emp-header-title">Welcome, {empName}</div>
            <div className="emp-header-subtitle">View your profile, QR code, and attendance history.</div>
          </div>
        </header>

        <div className="emp-content">
          {meError && <div className="alert alert-error">{meError}</div>}
          <Outlet context={{ me }} />
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;

