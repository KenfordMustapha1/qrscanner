import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const MyQRCode = () => {
  const { me } = useOutletContext();
  const employee = me?.employee;
  const [qrCodeImage] = useState(me?.qrCodeImage || null);

  const subtitle = useMemo(() => {
    if (!employee) return '';
    return `${employee.name} • ${employee.employeeId}`;
  }, [employee]);

  return (
    <div className="emp-card">
      <div className="emp-card-title">My QR Code</div>
        <div className="emp-card-subtitle">
          Show this QR code during the scheduled scan time.
        </div>
      <div className="emp-qr-wrap">
        <div className="emp-qr-meta">
          <div className="emp-qr-name">{employee?.name || '—'}</div>
          <div className="emp-qr-sub">{subtitle}</div>
          {employee?.department && <div className="emp-pill">{employee.department}</div>}
          <div className="emp-qr-note">
            This QR code expires quickly for security. If it won’t scan, wait for it to refresh and try again.
          </div>
        </div>

        <div className="emp-qr-box">
          {qrCodeImage ? (
            <img
              src={qrCodeImage}
              alt="QR Code"
              className="emp-qr-img"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="emp-empty">QR not available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyQRCode;

