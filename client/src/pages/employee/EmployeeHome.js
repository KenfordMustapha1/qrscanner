import React, { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';

const EmployeeHome = () => {
  const { me } = useOutletContext();
  const employee = me?.employee;
  const today = me?.todayAttendance;

  const statusText = useMemo(() => {
    if (!today) return 'No scan yet today';
    if (today.timeIn && !today.timeOut) return `Time-In recorded (${today.timeIn})`;
    if (today.timeIn && today.timeOut) return `Time-Out recorded (${today.timeOut})`;
    return '—';
  }, [today]);

  return (
    <div className="emp-grid">
      <div className="emp-card emp-hero">
        <div className="emp-hero-title">Dashboard</div>
        <div className="emp-hero-sub">Here’s a quick summary of your information and today’s attendance.</div>

        <div className="emp-kpis">
          <div className="emp-kpi">
            <div className="emp-kpi-label">Employee Name</div>
            <div className="emp-kpi-value">{employee?.name || '—'}</div>
          </div>
          <div className="emp-kpi">
            <div className="emp-kpi-label">Employee ID</div>
            <div className="emp-kpi-value">{employee?.employeeId || '—'}</div>
          </div>
          <div className="emp-kpi">
            <div className="emp-kpi-label">Department</div>
            <div className="emp-kpi-value">{employee?.department || '—'}</div>
          </div>
          <div className="emp-kpi">
            <div className="emp-kpi-label">Today</div>
            <div className="emp-kpi-value">{statusText}</div>
            {today?.status && <div className={`emp-pill ${today.status.toLowerCase()}`}>{today.status}</div>}
          </div>
        </div>

        <div className="emp-cta-row">
          <Link className="btn btn-primary" to="/employee/qr">View My QR Code</Link>
          <Link className="btn btn-secondary" to="/employee/history">View Attendance History</Link>
        </div>
      </div>

      <div className="emp-card">
        <div className="emp-card-title">Today’s Attendance</div>
        {!today ? (
          <div className="emp-empty">No record yet today. Scan your QR code during the scheduled time.</div>
        ) : (
          <div className="emp-detail">
            <div><strong>Date:</strong> {new Date(today.date).toLocaleDateString()}</div>
            <div><strong>Time-In:</strong> {today.timeIn || '—'}</div>
            <div><strong>Time-Out:</strong> {today.timeOut || '—'}</div>
            <div><strong>Status:</strong> {today.status || 'Present'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeHome;

