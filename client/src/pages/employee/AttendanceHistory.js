import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useOutletContext } from 'react-router-dom';

const AttendanceHistory = () => {
  const { me } = useOutletContext();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/employee/attendance');
        setAttendance(res.data.attendance || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="emp-card">
      <div className="emp-card-title">Attendance History</div>
      <div className="emp-card-subtitle">
        {me?.employee?.name ? `Records for ${me.employee.name}` : 'Your attendance records'}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : attendance.length === 0 ? (
        <div className="emp-empty">No attendance records yet.</div>
      ) : (
        <div className="emp-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time-In</th>
                <th>Time-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.timeIn || '—'}</td>
                  <td>{r.timeOut || '—'}</td>
                  <td><span className={`status-badge status-${String(r.status || '').toLowerCase()}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;

