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
  const [scannerStatus, setScannerStatus] = useState({ available: false, mode: null, message: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [isWindowsDesktop, setIsWindowsDesktop] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const scannerRef = useRef(null);

  const minutesFromHHMM = (hhmm) => {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return (h * 60) + m;
  };

  const getUnavailableMessage = (status) => {
    const schedule = status?.schedule;
    const now = status?.now;
    if (!schedule || !now) return status?.message || 'Scanner is currently unavailable. Please wait for the scheduled scan time.';

    const t = minutesFromHHMM(now);
    const inStart = minutesFromHHMM(schedule?.timeIn?.start);
    const inEnd = minutesFromHHMM(schedule?.timeIn?.end);
    const outStart = minutesFromHHMM(schedule?.timeOut?.start);
    const outEnd = minutesFromHHMM(schedule?.timeOut?.end);

    if (Number.isFinite(inStart) && t < inStart) {
      return 'Scanner is currently unavailable. Please wait for the scheduled scan time.';
    }
    if (Number.isFinite(inEnd) && Number.isFinite(outStart) && t > inEnd && t < outStart) {
      return 'Time-In scanning is closed.';
    }
    if (Number.isFinite(outEnd) && t > outEnd) {
      return 'Time-Out scanning is closed.';
    }
    return status?.message || 'Scanner is currently unavailable. Please wait for the scheduled scan time.';
  };

  const nextAvailableText = (status) => {
    const schedule = status?.schedule;
    if (!schedule) return null;
    const inStart = schedule?.timeIn?.start;
    const outStart = schedule?.timeOut?.start;
    return outStart ? `Next available scan time: ${outStart}.` : (inStart ? `Next available scan time: ${inStart}.` : null);
  };

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

    if (!scannerStatus.available) {
      setError(getUnavailableMessage(scannerStatus));
      return;
    }

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

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await api.get('/attendance/status');
        if (!isMounted) return;
        setScannerStatus(res.data);
        if (!res.data?.available && isScanning) {
          await stopScanner();
          setError(getUnavailableMessage(res.data));
        }
      } catch (e) {
        // If status endpoint fails, don't hard block scanning, but show a hint.
        if (!isMounted) return;
        setScannerStatus((prev) => ({ ...prev, message: 'Unable to load scanner schedule.' }));
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 10000); // poll every 10s
    return () => {
      isMounted = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

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
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      const apiAttendance = error.response?.data?.attendance;

      if (error.response?.status === 403) {
        setError(apiMessage || getUnavailableMessage(scannerStatus));
      } else {
        setError(apiMessage || 'Failed to record attendance');
      }

      // If backend returned an existing attendance (e.g., already completed),
      // show it in the result card so admin can see times.
      if (apiAttendance) {
        setScanResult(apiAttendance);
      }
      await stopScanner();
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
        <p className="scanner-subtitle">
          {scannerStatus.available
            ? (scannerStatus.mode === 'IN' ? 'Time-In scanning is open' : 'Time-Out scanning is open')
            : 'Scanner is currently unavailable'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {scannerStatus.available ? (
          <div id="reader" className="qr-reader"></div>
        ) : (
          <div className="card scan-notice">
            <h3 className="scan-result-title">Scanner Unavailable</h3>
            <p><strong>Status:</strong> {getUnavailableMessage(scannerStatus)}</p>
            <p><strong>Next:</strong> {nextAvailableText(scannerStatus) || 'Please wait for the next scheduled scan time.'}</p>
          </div>
        )}

        {isMobile && cameras.length > 0 && (
          <div className="input-group camera-select">
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
            disabled={isScanning || loading || !scannerStatus.available}
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
          <div className="card scan-result">
            <h3 className="scan-result-title">Details</h3>
            <p><strong>Name:</strong> {scanResult.userName}</p>
            {scanResult.employeeId && <p><strong>Employee ID:</strong> {scanResult.employeeId}</p>}
            {scanResult.department && <p><strong>Department:</strong> {scanResult.department}</p>}
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