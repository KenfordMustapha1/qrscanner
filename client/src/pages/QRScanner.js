import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../utils/api';
import '../styles/QRScanner.css';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isWindowsDesktop, setIsWindowsDesktop] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const scannerRef = useRef(null);

  const stopScanner = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {}
    setIsScanning(false);
  };

  const startScanner = async () => {
    setError('');
    setSuccess('');

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('reader');
    }

    try {
      let cameraConfig;

      if (isWindowsDesktop) {
        // Windows: use front camera only
        cameraConfig = { facingMode: 'user' };
      } else if (isMobile && selectedCameraId) {
        // Mobile with explicit choice
        cameraConfig = { deviceId: { exact: selectedCameraId } };
      } else if (isMobile) {
        // Mobile fallback: prefer back camera
        cameraConfig = { facingMode: 'environment' };
      } else {
        // Other desktops: default to front
        cameraConfig = { facingMode: 'user' };
      }

      await scannerRef.current.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      setError('Unable to start camera. Check permissions and try again.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Detect device type (mobile vs Windows desktop)
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window).opera || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(ua);
      const isWindows = /Windows NT/i.test(ua);

      setIsMobile(isMobileDevice);
      setIsWindowsDesktop(isWindows && !isMobileDevice);

      if (isMobileDevice) {
        Html5Qrcode.getCameras?.()
          .then((devices) => {
            if (!devices || !devices.length) return;
            setCameras(devices);

            // Try to pick back camera by label, else first
            const backCamera = devices.find((d) =>
              /back|rear/i.test(d.label || '')
            );
            const defaultCamera = backCamera || devices[0];
            setSelectedCameraId(defaultCamera.id);
          })
          .catch(() => {});
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handleScan = async (qrCode) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/attendance/scan', { qrCode });
      const attendance = response.data.attendance;
      const action = attendance?.action;

      if (action === 'OUT') {
        setSuccess(`Time out recorded for ${attendance.userName}!`);
      } else {
        setSuccess(`Time in recorded for ${attendance.userName}!`);
      }

      setScanResult(attendance);
      await stopScanner();

      setTimeout(() => {
        setSuccess('');
        setScanResult(null);
        startScanner();
      }, 3000);
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      const apiAttendance = error.response?.data?.attendance;

      setError(apiMessage || 'Failed to record attendance');

      // If backend returned an existing attendance (e.g., already completed),
      // show it in the result card so admin can see times.
      if (apiAttendance) {
        setScanResult(apiAttendance);
      }
      await stopScanner();
      setTimeout(() => {
        setError('');
        setScanResult(null);
        startScanner();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraChange = async (event) => {
    const newCameraId = event.target.value;
    setSelectedCameraId(newCameraId);

    // If scanner is running, restart with the newly selected camera
    if (isScanning) {
      await stopScanner();
      startScanner();
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <h1>QR Code Scanner</h1>
        <p className="scanner-subtitle">Scan your QR code to record attendance</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div id="reader" className="qr-reader"></div>

        {isMobile && cameras.length > 0 && (
          <div className="camera-select">
            <label htmlFor="camera-select">Camera</label>
            <select
              id="camera-select"
              value={selectedCameraId}
              onChange={handleCameraChange}
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="scanner-actions">
          <button
            className="btn btn-accent"
            onClick={startScanner}
            disabled={isScanning || loading}
          >
            {isScanning ? 'Scanning...' : 'Start Scanning'}
          </button>
          {isScanning && (
            <button
              className="btn btn-secondary"
              onClick={stopScanner}
              disabled={loading}
            >
              Stop
            </button>
          )}
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Recording attendance...</p>
          </div>
        )}

        {scanResult && (
          <div className="scan-result">
            <h3>Attendance Recorded</h3>
            <p><strong>Name:</strong> {scanResult.userName}</p>
            <p><strong>Email:</strong> {scanResult.userEmail}</p>
            <p><strong>Date:</strong> {new Date(scanResult.date).toLocaleDateString()}</p>
            <p><strong>Time In:</strong> {scanResult.timeIn || scanResult.time}</p>
            <p><strong>Time Out:</strong> {scanResult.timeOut || '—'}</p>
            <p><strong>Status:</strong> {scanResult.status}</p>
          </div>
        )}

        <div className="scanner-info">
          <p>Position the QR code within the frame</p>
          <p>Ensure proper lighting for accurate scanning</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;