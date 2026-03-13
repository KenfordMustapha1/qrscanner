import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';
import '../styles/AdminLogin.css';

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login } = useEmployeeAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(employeeId, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Login failed');
      return;
    }
    navigate('/employee', { replace: true });
  };

  return (
    <div
      className="login-container employee-login"
      style={{
        backgroundImage: "url('/skloginbg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="login-card">
        <div className="login-logo">
          <img src="/sklogo.png" alt="System logo" />
        </div>
        <h1>Employee Login</h1>
        <p className="login-subtitle">Access your attendance dashboard</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter your employee ID"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Link to="/scan" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
            Go to Scanner
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;

